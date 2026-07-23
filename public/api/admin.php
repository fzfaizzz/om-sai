<?php
// admin.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// --- HMAC AUTHENTICATION CHECK ---
function get_auth_token() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } else if (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
            return $matches[1];
        }
    }
    return $_POST['token'] ?? $_GET['token'] ?? null;
}

function verify_admin_token() {
    $token = get_auth_token();
    if (!$token) return false;

    $secret_key = "OmSai#AuthSecret@2026!SecureKey";
    $parts = explode('.', $token);
    if (count($parts) !== 2) return false;

    $encoded_payload = $parts[0];
    $signature = $parts[1];

    $expected_signature = hash_hmac('sha256', $encoded_payload, $secret_key);
    if (!hash_equals($expected_signature, $signature)) return false;

    $payload = json_decode(base64_decode($encoded_payload), true);
    if (!$payload || !isset($payload['exp']) || time() > $payload['exp']) {
        return false;
    }
    return $payload;
}

$authenticated_user = verify_admin_token();
if (!$authenticated_user) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized access. Valid admin token required."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch all certificates
        try {
            $stmt = $conn->prepare("SELECT * FROM certificates ORDER BY created_at DESC");
            $stmt->execute();
            $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $formatted = array_map(function ($cert) {
                $formType = isset($cert['form_type']) ? $cert['form_type'] : 'Form C';
                $expiryDate = $cert['expiry_date'];
                
                // Dynamically fix old Form A records returning null or 2099 dates
                if ($formType === 'Form A' || $formType === 'FORM A' || $formType === 'A') {
                    if (!$expiryDate || str_starts_with($expiryDate, '2099')) {
                        $issueYear = date('Y', strtotime($cert['issue_date']));
                        $expiryDate = $issueYear . '-12-31';
                    }
                }

                $rawPdfPath = $cert['pdf_path'] ?? '';
                $pdfPaths = [];
                if (!empty($rawPdfPath)) {
                    $decoded = json_decode($rawPdfPath, true);
                    if (is_array($decoded)) {
                        $pdfPaths = $decoded;
                    } else {
                        $pdfPaths = [$rawPdfPath];
                    }
                }

                return [
                    "id" => $cert['id'],
                    "certificateId" => $cert['certificate_id'],
                    "name" => $cert['full_name'],
                    "companyName" => $cert['company_name'] ?? '',
                    "course" => $cert['course_name'],
                    "formType" => $formType,
                    "issueDate" => $cert['issue_date'],
                    "expiryDate" => $expiryDate,
                    "status" => $cert['status'],
                    "issuedBy" => $cert['issued_by'] ?? 'Admin',
                    "pdfPath" => count($pdfPaths) > 0 ? $pdfPaths[0] : '',
                    "pdfPaths" => $pdfPaths,
                    "createdAt" => $cert['created_at']
                ];
            }, $certificates);

            echo json_encode($formatted);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
    case 'PUT':
        // Add or Update certificate
        $input_data = json_decode(file_get_contents("php://input"), true) ?? [];
        $data = (object) array_merge($input_data, $_POST);

        // Check if this is a DELETE request tunnelled through POST
        if (isset($data->action) && strtoupper($data->action) === 'DELETE') {
            if (!empty($data->id)) {
                try {
                    $stmt = $conn->prepare("DELETE FROM certificates WHERE id = :id");
                    $stmt->bindParam(':id', $data->id);

                    if ($stmt->execute()) {
                        // Log Action
                        $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details) VALUES ('DELETE', :cert_id, :action_by, :details)");
                        $logStmt->execute([
                            ':cert_id' => $data->id,
                            ':action_by' => $authenticated_user['user'] ?? 'Admin',
                            ':details' => "Certificate ID: " . $data->id . " deleted"
                        ]);

                        echo json_encode(["message" => "Certificate deleted successfully"]);
                    } else {
                        http_response_code(503);
                        echo json_encode(["error" => "Unable to delete certificate"]);
                    }
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Incomplete data"]);
            }
            break;
        }

        $form_type = strtoupper(trim($data->formType ?? $data->form_type ?? ''));
        $certificate_id = trim($data->certificateId ?? $data->certificate_id ?? '');
        $full_name = trim($data->name ?? $data->full_name ?? '');
        $company_name = trim($data->companyName ?? $data->company_name ?? '');
        $course_name = trim($data->course ?? $data->course_name ?? '');
        $issue_date = trim($data->issueDate ?? $data->issue_date ?? '');
        $status = trim($data->status ?? 'Active');
        $frontend_expiry = trim($data->expiryDate ?? $data->expiry_date ?? '');

        $missing = [];
        if (!$form_type) $missing[] = 'formType';
        if (!$certificate_id) $missing[] = 'certificateId';
        if (!$full_name) $missing[] = 'name';
        if (!$course_name) $missing[] = 'course';
        if (!$issue_date) $missing[] = 'issueDate';

        if (count($missing) > 0) {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data. Missing: " . implode(', ', $missing)]);
            exit;
        }

        $issue_time = strtotime($issue_date);
        $year = (int) date('Y', $issue_time);
        $issued_by = trim($data->issuedBy ?? $data->issued_by ?? $authenticated_user['role'] ?? 'Admin');

        $validity_start = null;
        $expiry_date = null;

        if ($form_type === 'FORM B' || $form_type === 'B') {
            $form_type = 'Form B';
            if (!empty($frontend_expiry)) {
                $expiry_date = $frontend_expiry;
                $exp_year = (int) date('Y', strtotime($expiry_date));
                if (str_ends_with($expiry_date, '06-30')) {
                    $validity_start = sprintf('%04d-01-01', $exp_year);
                } else {
                    $validity_start = sprintf('%04d-07-01', $exp_year);
                }
            } else {
                $month = (int) date('n', $issue_time);
                if ($month <= 6) {
                    $validity_start = sprintf('%04d-07-01', $year);
                    $expiry_date = sprintf('%04d-12-31', $year);
                } else {
                    $validity_start = sprintf('%04d-01-01', $year + 1);
                    $expiry_date = sprintf('%04d-06-30', $year + 1);
                }
            }
        } elseif ($form_type === 'FORM A' || $form_type === 'A') {
            $form_type = 'Form A';
            $validity_start = $issue_date;
            $expiry_date = date('Y', $issue_time) . '-12-31';
        } elseif ($form_type === 'FORM C' || $form_type === 'C') {
            $form_type = 'Form C';
            $validity_start = $issue_date;
            $expiry_date = date('Y-m-d', strtotime('+365 days', $issue_time));
        }

        // --- MULTIPLE PDF HANDLING & RETENTION/REMOVAL ---
        $existing_pdfs = [];
        if (isset($data->existingPdfPaths)) {
            if (is_array($data->existingPdfPaths)) {
                $existing_pdfs = $data->existingPdfPaths;
            } else if (is_string($data->existingPdfPaths)) {
                $decoded = json_decode($data->existingPdfPaths, true);
                if (is_array($decoded)) {
                    $existing_pdfs = $decoded;
                } else if (!empty($data->existingPdfPaths)) {
                    $existing_pdfs = array_map('trim', explode(',', $data->existingPdfPaths));
                }
            }
        }

        $files_to_process = [];
        $upload_errors = [];

        if (!empty($_FILES)) {
            foreach ($_FILES as $key => $file_item) {
                if (is_array($file_item['name'])) {
                    for ($i = 0; $i < count($file_item['name']); $i++) {
                        if ($file_item['error'][$i] === UPLOAD_ERR_OK) {
                            $files_to_process[] = [
                                'name' => $file_item['name'][$i],
                                'tmp_name' => $file_item['tmp_name'][$i]
                            ];
                        } else if ($file_item['error'][$i] !== UPLOAD_ERR_NO_FILE) {
                            $upload_errors[] = "File " . $file_item['name'][$i] . " upload failed (code " . $file_item['error'][$i] . ")";
                        }
                    }
                } else {
                    if ($file_item['error'] === UPLOAD_ERR_OK) {
                        $files_to_process[] = [
                            'name' => $file_item['name'],
                            'tmp_name' => $file_item['tmp_name']
                        ];
                    } else if ($file_item['error'] !== UPLOAD_ERR_NO_FILE) {
                        $upload_errors[] = "File " . $file_item['name'] . " upload failed (code " . $file_item['error'] . ")";
                    }
                }
            }
        }

        if (count($upload_errors) > 0 && count($files_to_process) === 0 && count($existing_pdfs) === 0) {
            http_response_code(400);
            echo json_encode(["error" => implode(', ', $upload_errors)]);
            exit();
        }

        $new_pdf_paths = $existing_pdfs;
        $upload_dir = __DIR__ . '/../uploads/';
        if (!is_dir($upload_dir)) {
            @mkdir($upload_dir, 0777, true);
        }

        foreach ($files_to_process as $file_item) {
            if (count($new_pdf_paths) >= 3) break; // Maximum 3 PDFs allowed

            $file_ext = strtolower(pathinfo($file_item['name'], PATHINFO_EXTENSION));

            // STRICT PDF FILE VALIDATION FOR SECURITY (No PHP scripts allowed)
            if ($file_ext !== 'pdf') {
                http_response_code(400);
                echo json_encode(["error" => "Security Violation: Only PDF files (.pdf) are allowed."]);
                exit();
            }

            $clean_cert_id = preg_replace('/[^a-zA-Z0-9]/', '_', $certificate_id);
            $new_filename = 'cert_' . $clean_cert_id . '_' . time() . '_' . rand(100, 999) . '.pdf';
            $dest_path = $upload_dir . $new_filename;

            if (move_uploaded_file($file_item['tmp_name'], $dest_path)) {
                $new_pdf_paths[] = 'uploads/' . $new_filename;
            }
        }

        $final_pdf_paths = array_values(array_unique($new_pdf_paths));
        $pdf_path_db = json_encode($final_pdf_paths);

        try {
            $is_update = !empty($data->id);
            if (!$is_update) {
                $checkStmt = $conn->prepare("SELECT id FROM certificates WHERE certificate_id = :certId");
                $checkStmt->bindParam(':certId', $certificate_id);
                $checkStmt->execute();

                if ($checkStmt->rowCount() > 0) {
                    http_response_code(409);
                    echo json_encode(["error" => "Certificate ID already exists"]);
                    exit();
                }

                $query = "INSERT INTO certificates (form_type, certificate_id, full_name, company_name, course_name, issue_date, validity_start, expiry_date, status, issued_by, pdf_path) VALUES (:form_type, :certificate_id, :full_name, :company_name, :course_name, :issue_date, :validity_start, :expiry_date, :status, :issued_by, :pdf_path)";
            } else { // UPDATE
                if (empty($data->id)) {
                    http_response_code(400);
                    echo json_encode(["error" => "Missing ID for update"]);
                    exit();
                }
                $query = "UPDATE certificates SET form_type = :form_type, certificate_id = :certificate_id, full_name = :full_name, company_name = :company_name, course_name = :course_name, issue_date = :issue_date, validity_start = :validity_start, expiry_date = :expiry_date, status = :status, issued_by = :issued_by, pdf_path = :pdf_path WHERE id = :id";
            }

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':form_type', $form_type);
            $stmt->bindParam(':certificate_id', $certificate_id);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':company_name', $company_name);
            $stmt->bindParam(':course_name', $course_name);
            $stmt->bindParam(':issue_date', $issue_date);
            $stmt->bindParam(':validity_start', $validity_start);
            if ($expiry_date === null) {
                $stmt->bindValue(':expiry_date', null, PDO::PARAM_NULL);
            } else {
                $stmt->bindParam(':expiry_date', $expiry_date);
            }
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':issued_by', $issued_by);
            $stmt->bindParam(':pdf_path', $pdf_path_db);

            if ($is_update) {
                $stmt->bindParam(':id', $data->id);
            }

            if ($stmt->execute()) {
                $action = (!$is_update ? 'CREATE' : 'UPDATE');
                $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details) VALUES (:action, :cert_id, :by, :details)");
                $logStmt->execute([
                    ':action' => $action,
                    ':cert_id' => $certificate_id,
                    ':by' => $issued_by,
                    ':details' => "Certificate $certificate_id for $company_name " . (!$is_update ? 'created' : 'updated')
                ]);

                http_response_code(!$is_update ? 201 : 200);
                echo json_encode(["message" => "Certificate processed successfully"]);
            } else {
                http_response_code(503);
                echo json_encode(["error" => "Unable to process certificate"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->id)) {
            try {
                $stmt = $conn->prepare("DELETE FROM certificates WHERE id = :id");
                $stmt->bindParam(':id', $data->id);

                if ($stmt->execute()) {
                    $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details) VALUES ('DELETE', :cert_id, :action_by, :details)");
                    $logStmt->execute([
                        ':cert_id' => $data->id,
                        ':action_by' => $authenticated_user['user'] ?? 'Admin',
                        ':details' => "Certificate ID: " . $data->id . " deleted"
                    ]);

                    echo json_encode(["message" => "Certificate deleted successfully"]);
                } else {
                    http_response_code(503);
                    echo json_encode(["error" => "Unable to delete certificate"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Incomplete data"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
?>

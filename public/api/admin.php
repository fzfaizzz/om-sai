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

@ini_set('memory_limit', '256M');
@ini_set('max_execution_time', '120');
date_default_timezone_set('Asia/Kolkata');

require_once 'db.php';

// Cache raw input once (php://input can only be read once)
$GLOBALS['_RAW_INPUT'] = file_get_contents("php://input");

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
    if (!empty($_POST['token'])) return $_POST['token'];
    if (!empty($_GET['token'])) return $_GET['token'];

    // Check JSON body (for application/json requests like DELETE)
    $raw = $GLOBALS['_RAW_INPUT'] ?? '';
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json) && !empty($json['token'])) {
            return $json['token'];
        }
    }
    return null;
}

function get_authenticated_user($conn) {
    $token = get_auth_token();
    if (empty($token)) {
        return ["user" => "Admin", "role" => "Admin"];
    }

    $parts = explode('.', $token);
    if (count($parts) >= 1) {
        $decoded = json_decode(base64_decode($parts[0]), true);
        if (is_array($decoded) && !empty($decoded['user'])) {
            $username = $decoded['user'];

            // Master account bypass
            if ($username === 'Faiz1') {
                return ["user" => "Faiz1", "role" => "Admin"];
            }

            try {
                $stmt = $conn->prepare("SELECT username, role FROM users WHERE username = :u LIMIT 1");
                $stmt->execute([':u' => $username]);
                $dbUser = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($dbUser) {
                    return ["user" => $dbUser['username'], "role" => $dbUser['role']];
                } else {
                    // User was deleted or username changed -> Force Logout!
                    http_response_code(401);
                    echo json_encode(["error" => "Account deleted or credentials updated. Session invalidated.", "logout" => true]);
                    exit;
                }
            } catch (Exception $e) {
                return ["user" => $username, "role" => $decoded['role'] ?? 'Admin'];
            }
        }
    }
    return ["user" => "Admin", "role" => "Admin"];
}

$authenticated_user = get_authenticated_user($conn);

// Fast heartbeat check without running full certificate query
if (isset($_GET['heartbeat'])) {
    echo json_encode(["status" => "active", "user" => $authenticated_user['user']]);
    exit;
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
        // Add or Update certificate - use cached raw input
        $input_data = json_decode($GLOBALS['_RAW_INPUT'], true) ?? [];
        $data = (object) array_merge($input_data, $_POST);

        // Check if this is a DELETE request tunnelled through POST
        if (isset($data->action) && strtoupper($data->action) === 'DELETE') {
            if (!empty($data->id)) {
                try {
                    // Fetch actual certificate_id BEFORE deleting (for proper audit log)
                    $lookupStmt = $conn->prepare("SELECT certificate_id, company_name FROM certificates WHERE id = :id");
                    $lookupStmt->bindParam(':id', $data->id);
                    $lookupStmt->execute();
                    $certRow = $lookupStmt->fetch(PDO::FETCH_ASSOC);
                    $actual_cert_id = $certRow ? $certRow['certificate_id'] : $data->id;
                    $company = $certRow ? $certRow['company_name'] : 'Unknown';

                    $stmt = $conn->prepare("DELETE FROM certificates WHERE id = :id");
                    $stmt->bindParam(':id', $data->id);

                    if ($stmt->execute()) {
                        $log_time = date('Y-m-d H:i:s');
                        $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details, created_at) VALUES ('DELETE', :cert_id, :action_by, :details, :created_at)");
                        $logStmt->execute([
                            ':cert_id' => $actual_cert_id,
                            ':action_by' => $authenticated_user['user'] ?? 'Admin',
                            ':details' => "Certificate $actual_cert_id for $company deleted",
                            ':created_at' => $log_time
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
                        if ($file_item['error'][$i] === UPLOAD_ERR_OK && is_uploaded_file($file_item['tmp_name'][$i])) {
                            $files_to_process[] = [
                                'name' => $file_item['name'][$i],
                                'tmp_name' => $file_item['tmp_name'][$i]
                            ];
                        } else if ($file_item['error'][$i] !== UPLOAD_ERR_NO_FILE && $file_item['error'][$i] !== UPLOAD_ERR_OK) {
                            $upload_errors[] = "File " . $file_item['name'][$i] . " upload failed (code " . $file_item['error'][$i] . ")";
                        }
                    }
                } else {
                    if ($file_item['error'] === UPLOAD_ERR_OK && is_uploaded_file($file_item['tmp_name'])) {
                        $files_to_process[] = [
                            'name' => $file_item['name'],
                            'tmp_name' => $file_item['tmp_name']
                        ];
                    } else if ($file_item['error'] !== UPLOAD_ERR_NO_FILE && $file_item['error'] !== UPLOAD_ERR_OK) {
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

        $file_counter = 0;
        foreach ($files_to_process as $file_item) {
            if (count($new_pdf_paths) >= 3) break;

            $file_ext = strtolower(pathinfo($file_item['name'], PATHINFO_EXTENSION));

            if ($file_ext !== 'pdf') {
                http_response_code(400);
                echo json_encode(["error" => "Security Violation: Only PDF files (.pdf) are allowed."]);
                exit();
            }

            $short_id = substr(preg_replace('/[^a-zA-Z0-9]/', '', $certificate_id), 0, 15);
            $unique = substr(uniqid('', true), -8);
            $new_filename = $short_id . '_' . $file_counter . '_' . $unique . '.pdf';
            $file_counter++;
            $dest_path = $upload_dir . $new_filename;

            if (move_uploaded_file($file_item['tmp_name'], $dest_path)) {
                $new_pdf_paths[] = 'uploads/' . $new_filename;
            }
        }

        $final_pdf_paths = array_values($new_pdf_paths);
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

                $created_at_now = date('Y-m-d H:i:s');
                $query = "INSERT INTO certificates (form_type, certificate_id, full_name, company_name, course_name, issue_date, validity_start, expiry_date, status, issued_by, pdf_path, created_at) VALUES (:form_type, :certificate_id, :full_name, :company_name, :course_name, :issue_date, :validity_start, :expiry_date, :status, :issued_by, :pdf_path, :created_at)";
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

            if (!$is_update) {
                $stmt->bindParam(':created_at', $created_at_now);
            }

            if ($is_update) {
                $stmt->bindParam(':id', $data->id);
            }

            if ($stmt->execute()) {
                $action = (!$is_update ? 'CREATE' : 'UPDATE');
                $log_time = date('Y-m-d H:i:s');
                $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details, created_at) VALUES (:action, :cert_id, :by, :details, :created_at)");
                $logStmt->execute([
                    ':action' => $action,
                    ':cert_id' => $certificate_id,
                    ':by' => $issued_by,
                    ':details' => "Certificate $certificate_id for $company_name " . (!$is_update ? 'created' : 'updated'),
                    ':created_at' => $log_time
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
        $data = json_decode($GLOBALS['_RAW_INPUT']);

        if (!empty($data->id)) {
            try {
                // Fetch actual certificate_id BEFORE deleting (for proper audit log)
                $lookupStmt = $conn->prepare("SELECT certificate_id, company_name FROM certificates WHERE id = :id");
                $lookupStmt->bindParam(':id', $data->id);
                $lookupStmt->execute();
                $certRow = $lookupStmt->fetch(PDO::FETCH_ASSOC);
                $actual_cert_id = $certRow ? $certRow['certificate_id'] : $data->id;
                $company = $certRow ? $certRow['company_name'] : 'Unknown';

                $stmt = $conn->prepare("DELETE FROM certificates WHERE id = :id");
                $stmt->bindParam(':id', $data->id);

                if ($stmt->execute()) {
                    $log_time = date('Y-m-d H:i:s');
                    $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details, created_at) VALUES ('DELETE', :cert_id, :action_by, :details, :created_at)");
                    $logStmt->execute([
                        ':cert_id' => $actual_cert_id,
                        ':action_by' => $authenticated_user['user'] ?? 'Admin',
                        ':details' => "Certificate $actual_cert_id for $company deleted",
                        ':created_at' => $log_time
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

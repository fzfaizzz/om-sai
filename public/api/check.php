<?php
// check.php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$id = isset($_GET['id']) ? trim($_GET['id']) : '';

if (empty($id)) {
    http_response_code(400);
    echo json_encode(["error" => "Certificate ID is required"]);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT * FROM certificates WHERE certificate_id = :id LIMIT 1");
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    $certificate = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($certificate) {
        // Map database columns to frontend expected JSON format
        echo json_encode([
            "id" => $certificate['id'],
            "certificateId" => $certificate['certificate_id'],
            "name" => $certificate['full_name'],
            "companyName" => $certificate['company_name'] ?? '',
            "course" => $certificate['course_name'],
            "formType" => isset($certificate['form_type']) ? $certificate['form_type'] : 'Form C',
            "issueDate" => $certificate['issue_date'],
            "expiryDate" => $certificate['expiry_date'],
            "status" => $certificate['status'],
            "issuedBy" => $certificate['issued_by'] ?? 'Admin',
            "pdfPath" => $certificate['pdf_path'] ?? ''
        ]);
    } else {
        echo json_encode(null); // Return null if not found
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>

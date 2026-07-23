<?php
// Run this ONCE on cPanel to increase pdf_path column size for multi-PDF support
// URL: https://omsaienterprisesmumbai.com/api/migrate_pdf_column.php

require_once 'db.php';

try {
    $conn->exec("ALTER TABLE certificates MODIFY COLUMN pdf_path TEXT");
    echo json_encode(["status" => "success", "message" => "pdf_path column upgraded to TEXT successfully"]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Migration failed: " . $e->getMessage()]);
}
?>

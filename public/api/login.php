<?php
// public/api/login.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing credentials"]);
    exit;
}

$user = trim($data->username);
$pass = trim($data->password);

$secret_key = "OmSai#AuthSecret@2026!SecureKey";
$authenticated_role = null;

// Ensure users table exists and seed if empty
try {
    $tableQuery = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Assistant',
        created_at DATETIME NOT NULL
    )";
    $conn->exec($tableQuery);

    $checkStmt = $conn->query("SELECT COUNT(*) as count FROM users");
    $rowCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

    if ($rowCount == 0) {
        $now = date('Y-m-d H:i:s');
        $seedStmt = $conn->prepare("INSERT INTO users (username, password, role, created_at) VALUES (:u, :p, :r, :c)");
        $seedStmt->execute([':u' => 'oseadmin', ':p' => 'oseadmin@1122', ':r' => 'Admin', ':c' => $now]);
    } else {
        // Remove legacy oseassistant user if present in database
        $conn->exec("DELETE FROM users WHERE username = 'oseassistant'");
    }

    // Query DB for user
    $userStmt = $conn->prepare("SELECT username, password, role FROM users WHERE username = :u LIMIT 1");
    $userStmt->execute([':u' => $user]);
    $dbUser = $userStmt->fetch(PDO::FETCH_ASSOC);

    if ($dbUser && $dbUser['password'] === $pass) {
        $authenticated_role = $dbUser['role'];
    }
} catch (Exception $e) {
    // Database fallback to hardcoded credentials
    $admins = [
        'oseadmin' => ['password' => 'oseadmin@1122', 'role' => 'Admin']
    ];
    if (isset($admins[$user]) && $admins[$user]['password'] === $pass) {
        $authenticated_role = $admins[$user]['role'];
    }
}

if ($authenticated_role !== null) {
    $payload = [
        "user" => $user,
        "role" => $authenticated_role,
        "exp" => time() + (365 * 24 * 3600) // 1 Year Token Validity
    ];
    $encoded_payload = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $encoded_payload, $secret_key);
    $token = $encoded_payload . '.' . $signature;

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "role" => $authenticated_role,
        "token" => $token
    ]);
} else {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Incorrect username or password"]);
}
?>

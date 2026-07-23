<?php
// audit.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';
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
    $raw = $GLOBALS['_RAW_INPUT'] ?? '';
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json) && !empty($json['token'])) return $json['token'];
    }
    return null;
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
        $stmt->execute();
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($logs);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
?>

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

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing credentials"]);
    exit;
}

// HARDCODED SECURE ADMIN CREDENTIALS
$admins = [
    'oseadmin' => [
        'password' => 'oseadmin@1122',
        'role' => 'Admin'
    ],
    'oseassistant' => [
        'password' => 'oseassistant@1122',
        'role' => 'Assistant'
    ]
];

$user = trim($data->username);
$pass = trim($data->password);

if (isset($admins[$user]) && $admins[$user]['password'] === $pass) {
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "role" => $admins[$user]['role']
    ]);
} else {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Incorrect username or password"]);
}
?>

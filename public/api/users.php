<?php
// users.php - Dynamic User & Password Management API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

date_default_timezone_set('Asia/Kolkata');
$GLOBALS['_RAW_INPUT'] = file_get_contents("php://input");

// Ensure users table exists and is pre-seeded with initial accounts
function ensure_users_table($conn) {
    try {
        $tableQuery = "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'Assistant',
            created_at DATETIME NOT NULL
        )";
        $conn->exec($tableQuery);

        // Check if table is empty
        $checkStmt = $conn->query("SELECT COUNT(*) as count FROM users");
        $rowCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        if ($rowCount == 0) {
            $now = date('Y-m-d H:i:s');
            $seedStmt = $conn->prepare("INSERT INTO users (username, password, role, created_at) VALUES (:u, :p, :r, :c)");
            
            // Seed oseadmin
            $seedStmt->execute([':u' => 'oseadmin', ':p' => 'oseadmin@1122', ':r' => 'Admin', ':c' => $now]);
            // Seed oseassistant
            $seedStmt->execute([':u' => 'oseassistant', ':p' => 'oseassistant@1122', ':r' => 'Assistant', ':c' => $now]);
        }
    } catch (Exception $e) {
        // Table creation error handled gracefully
    }
}

ensure_users_table($conn);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $conn->query("SELECT id, username, role, created_at FROM users ORDER BY id ASC");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($users);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode($GLOBALS['_RAW_INPUT']);
        $action = strtoupper($data->action ?? '');

        if ($action === 'CREATE') {
            $username = trim($data->username ?? '');
            $password = trim($data->password ?? '');
            $role = trim($data->role ?? 'Assistant');

            if (empty($username) || empty($password)) {
                http_response_code(400);
                echo json_encode(["error" => "Username and password are required"]);
                exit;
            }

            try {
                // Check if username exists
                $check = $conn->prepare("SELECT id FROM users WHERE username = :u");
                $check->execute([':u' => $username]);
                if ($check->rowCount() > 0) {
                    http_response_code(409);
                    echo json_encode(["error" => "Username already exists"]);
                    exit;
                }

                $now = date('Y-m-d H:i:s');
                $stmt = $conn->prepare("INSERT INTO users (username, password, role, created_at) VALUES (:u, :p, :r, :c)");
                if ($stmt->execute([':u' => $username, ':p' => $password, ':r' => $role, ':c' => $now])) {
                    // Audit log
                    $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details, created_at) VALUES ('CREATE_USER', :cert_id, :by, :details, :c)");
                    $logStmt->execute([
                        ':cert_id' => $username,
                        ':by' => 'Admin',
                        ':details' => "New user '$username' ($role) created",
                        ':c' => $now
                    ]);

                    echo json_encode(["message" => "User created successfully"]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to create user"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Database error: " . $e->getMessage()]);
            }

        } elseif ($action === 'UPDATE_PASSWORD') {
            $username = trim($data->username ?? '');
            $new_password = trim($data->newPassword ?? $data->password ?? '');

            if (empty($username) || empty($new_password)) {
                http_response_code(400);
                echo json_encode(["error" => "Username and new password are required"]);
                exit;
            }

            try {
                $stmt = $conn->prepare("UPDATE users SET password = :p WHERE username = :u");
                if ($stmt->execute([':p' => $new_password, ':u' => $username])) {
                    if ($stmt->rowCount() === 0) {
                        http_response_code(404);
                        echo json_encode(["error" => "User not found"]);
                        exit;
                    }
                    $now = date('Y-m-d H:i:s');
                    $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details, created_at) VALUES ('CHANGE_PASSWORD', :cert_id, :by, :details, :c)");
                    $logStmt->execute([
                        ':cert_id' => $username,
                        ':by' => 'Admin',
                        ':details' => "Password changed for user '$username'",
                        ':c' => $now
                    ]);

                    echo json_encode(["message" => "Password updated successfully"]);
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to update password"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Database error: " . $e->getMessage()]);
            }

        } elseif ($action === 'DELETE') {
            $id = $data->id ?? null;
            $username = trim($data->username ?? '');

            if (!$id && !$username) {
                http_response_code(400);
                echo json_encode(["error" => "User ID or Username required"]);
                exit;
            }

            // Protect primary admin from deletion
            if ($username === 'oseadmin') {
                http_response_code(403);
                echo json_encode(["error" => "Primary Admin 'oseadmin' cannot be deleted"]);
                exit;
            }

            try {
                if ($id) {
                    $stmt = $conn->prepare("DELETE FROM users WHERE id = :id AND username != 'oseadmin'");
                    $stmt->execute([':id' => $id]);
                } else {
                    $stmt = $conn->prepare("DELETE FROM users WHERE username = :u AND username != 'oseadmin'");
                    $stmt->execute([':u' => $username]);
                }

                $now = date('Y-m-d H:i:s');
                $logStmt = $conn->prepare("INSERT INTO audit_logs (action, certificate_id, action_by, details, created_at) VALUES ('DELETE_USER', :cert_id, :by, :details, :c)");
                $logStmt->execute([
                    ':cert_id' => $username ?: (string)$id,
                    ':by' => 'Admin',
                    ':details' => "User '$username' deleted",
                    ':c' => $now
                ]);

                echo json_encode(["message" => "User deleted successfully"]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Database error: " . $e->getMessage()]);
            }

        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid action"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
?>

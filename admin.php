<?php
require 'config.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'get_passenger_by_booking') {
    $ref = $_GET['ref'];
    $stmt = $pdo->prepare("SELECT p.*, f.flight_number, f.gate, f.status FROM passengers p JOIN flights f ON p.flight_id = f.id WHERE p.booking_reference = ?");
    $stmt->execute([$ref]);
    $passenger = $stmt->fetch();
    echo json_encode($passenger ?: ['error' => 'Not found']);
    
} elseif ($action === 'check_in' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'];
    $checked = $_POST['checked']; // true or false
    $col = $checked ? 'checked_in' : 'no_show';
    $val = $checked ? 1 : 0;
    $opposite = $checked ? 'no_show' : 'checked_in';

    $stmt = $pdo->prepare("UPDATE passengers SET $col = ?, $opposite = 0 WHERE id = ?");
    $stmt->execute([$val, $id]);
    echo json_encode(['success' => true]);
    
} elseif ($action === 'get_translation') {
    $lang = $_GET['lang'] ?? 'en';
    $key = $_GET['key'] ?? '';
    $stmt = $pdo->prepare("SELECT value FROM translations WHERE lang = ? AND `key` = ?");
    $stmt->execute([$lang, $key]);
    $result = $stmt->fetchColumn();
    echo json_encode(['value' => $result ?: $key]);
}
?>
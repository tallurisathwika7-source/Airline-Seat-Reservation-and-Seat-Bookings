<?php
require 'config.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'get_flights') {
    $stmt = $pdo->query("SELECT * FROM flights ORDER BY departure_time");
    echo json_encode($stmt->fetchAll());
    
} elseif ($action === 'get_seats') {
    $flight_id = $_GET['flight_id'] ?? 1;
    $stmt = $pdo->prepare("SELECT * FROM seats WHERE flight_id = ? ORDER BY seat_number");
    $stmt->execute([$flight_id]);
    echo json_encode($stmt->fetchAll());
    
} elseif ($action === 'reserve_seat' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $flight_id = $_POST['flight_id'];
    $seat = $_POST['seat'];
    $passenger_id = $_POST['passenger_id'];

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("UPDATE seats SET is_occupied = 1, passenger_id = ? WHERE flight_id = ? AND seat_number = ? AND is_occupied = 0");
        $stmt->execute([$passenger_id, $flight_id, $seat]);

        $stmt2 = $pdo->prepare("UPDATE passengers SET seat = ? WHERE id = ?");
        $stmt2->execute([$seat, $passenger_id]);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
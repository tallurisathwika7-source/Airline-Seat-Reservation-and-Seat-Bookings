<?php
require '../vendor/autoload.php';
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

$ref = $_GET['ref'] ?? 'ABC123';
$qr = QrCode::create($ref)
    ->setSize(300)
    ->setMargin(10);

$writer = new PngWriter();
$result = $writer->write($qr);
header('Content-Type: image/png');
echo $result->getString();
?>
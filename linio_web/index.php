<?php

$realm = 'Restricted area';

//user => password
$users = array('admin' => 'mypass', 'guest' => 'guest', 'sam' => 'hunter2');


if (empty($_SERVER['PHP_AUTH_DIGEST'])) {
    header('HTTP/1.1 401 Unauthorized');
    header('WWW-Authenticate: Digest realm="'.$realm.
           '",qop="auth",nonce="'.uniqid().'",opaque="'.md5($realm).'"');
      
    die('Text to send if user hits Cancel button');
}
                       
                       
// analyze the PHP_AUTH_DIGEST variable
if (!($data = http_digest_parse($_SERVER['PHP_AUTH_DIGEST'])) ||
    !isset($users[$data['username']]))
    die('Wrong Credentials!');
                               
                               
// generate the valid response
$A1 = md5($data['username'] . ':' . $realm . ':' . $users[$data['username']]);
$A2 = md5($_SERVER['REQUEST_METHOD'].':'.$data['uri']);
$valid_response = md5($A1.':'.$data['nonce'].':'.$data['nc'].':'.$data['cnonce'].':'.$data['qop'].':'.$A2);

if ($data['response'] != $valid_response)
    die('Wrong Credentials!');
                                   
// ok, valid username & password

// Head
echo "<!DOCTYPE html>\n";
echo "<head>\n";
echo '<link rel="stylesheet" href="./style.css">'."\n";
echo '<title>TeamOrangeHub</title>'."\n";
echo "</head>\n";

// Body
echo "<html>\n";
echo "<body>\n";
echo "<table>\n";
echo "<th>Secure Sensor Hub</th>\n";
echo '<th>Hello ' . $data['username'].". Lookin' good today!</th>\n";

echo "<tr>\n";
// Navigation
// all of these are placeholders
echo "<td>\n";
echo "<div>\n";
echo "Navigation:<br>\n";
echo "Home <br>\n";
echo "Settings<br>\n";
echo "Controls<br>\n";
echo "Data<br>\n";
echo "Sensors<br>\n";
echo "</div>\n";
echo "</td>\n";

echo "<td>\n";
echo "<table>\n";

// sensor data tables
$devices = get_devices();

// generate the table headers
foreach ($devices as $device) {
    echo "<th>Data from ".$device."</th>\n";
}
echo "<tr>\n";
foreach ($devices as $device) {
    echo "<td>\n";
    csv_to_html_table("/mnt/sda1/deviceData/".$device.".csv");
    echo "</td>\n";
}
echo "</tr>\n";
echo "</table>\n";
echo "</td>\n";
echo "</tr>\n";
echo "</table>\n";
echo "\n</body></html>";
                                   
                                   
// function to parse the http auth header
function http_digest_parse($txt)
{
    // protect against missing data
    $needed_parts = array('nonce'=>1, 'nc'=>1, 'cnonce'=>1, 'qop'=>1, 'username'=>1, 'uri'=>1, 'response'=>1);
    $data = array();
    $keys = implode('|', array_keys($needed_parts));

    preg_match_all('@(' . $keys . ')=(?:([\'"])([^\2]+?)\2|([^\s,]+))@', $txt, $matches, PREG_SET_ORDER);

    foreach ($matches as $m) {
        $data[$m[1]] = $m[3] ? $m[3] : $m[4];
        unset($needed_parts[$m[1]]);
    }
                                                                               
    return $needed_parts ? false : $data;
}

function csv_to_html_table($filename)
{
    echo "<table>";
    $f = fopen($filename, "r");
    while (($line = fgetcsv($f)) !== false) {
        echo "<tr>";
        foreach ($line as $cell) {
            echo "<td>" . htmlspecialchars($cell) . "</td>";
        }
        echo "</tr>\n";
    }
    fclose($f);
    echo "</table>";
}

function get_devices()
{
    $devices = array();
    $f = fopen("/mnt/sda1/deviceData/devices.csv", "r");
    while (($line = fgetcsv($f)) !== false) {
        foreach ($line as $cell) {
            $devices[] = trim($cell);
        }
    }
    fclose($f);
    return $devices;
}
?>

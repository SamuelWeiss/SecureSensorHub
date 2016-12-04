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
echo "<html><body>\n\n";
echo 'Hello ' . $data['username'].". Lookin' good today!\n\n\n";
$devices = get_devices();
foreach ($devices as $device) {
    csv_to_html_table("deviceData/".$device.".csv");
}
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
    echo $f;
    echo "test";
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
    $f = fopen("deviceData/devices.csv", "r");
    while (($line = fgetcsv($f)) !== false) {
        foreach ($line as $cell) {
            $devices[] = trim($cell);
        }
    }
    fclose($f);
    return $devices;
}
?>

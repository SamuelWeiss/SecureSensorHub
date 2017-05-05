#include <SparkFun_Si7021_Breakout_Library.h>
#include <Wire.h>
#include "XBee.h"
#include "queue.h"

XBee xbee;
Queue RxQ;
Weather sensor;

void setup(void)
{
    Serial.begin(9600);
    sensor.begin();
}

void loop(void)
{
    delay(5); //is this needed?
    
    int queueLen = 0;
    int delPos = 0;

    while (Serial.available() > 0){
        unsigned char in = (unsigned char)Serial.read();
        if (!RxQ.Enqueue(in)){
            break;
        }
    }

    queueLen = RxQ.Size();
    for (int i = 0; i < queueLen; i++){
        if (RxQ.Peek(i) == 0x7E){
            unsigned char checkBuff[Q_SIZE];
            unsigned char msgBuff[Q_SIZE];
            int checkLen = 0;
            int msgLen = 0;

            checkLen = RxQ.Copy(checkBuff, i);
            msgLen = xbee.Receive(checkBuff, checkLen, msgBuff);

            if (msgLen > 0){
                unsigned char outMsg[Q_SIZE];
                unsigned char outFrame[Q_SIZE];
                unsigned char dataBuff[Q_SIZE];
                int frameLen = 0;
                int addr = ((int)msgBuff[4] << 8) + (int)msgBuff[5];
                float temp;
                /* TODO: check msgBuff for the correct command
                 * else, either send error message or resend
                 * command.
                 */

                // 10 is length of "TempSense "
                memcpy(outMsg, "TempSense ", 10);

                // Read Sensor Data & add it to the message
                temp = read_sensor();
                //temp.toCharArray(dataBuff, 5);
                dtostrf(temp, 6, 2, dataBuff);
                memcpy(&outMsg[10], &dataBuff, 5);

                // New length is 10 + 5 + 9 (header + checksum)
                msgLen = 15;
                frameLen = xbee.Send(outMsg, msgLen, outFrame, addr);
                Serial.write(outFrame, frameLen); 
                i += msgLen;
                delPos = i;    
            }else{
                if (i>0){
                    delPos = i-1;
                }
            }
        }
    }

    RxQ.Clear(delPos);
}
float read_sensor(){
  /*TODO: 
   *    Write code for a given sensor here. 
   */
  sensor.getRH();
  float temp = sensor.getTempF();
  return temp;
}


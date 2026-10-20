# How to reset everything
## Router
Press the small button under or behind the router that is labeled `RESET` for 10-20 seconds until the power LED flashes then release it to factory reset the Router
## Computer Setup


# How to get internet
in there there are 2 sets of IP address settings because one is for the Internet and one is for the router of the 

### How to get internet
**Default Gateway (Internet)**
```
192.168.2.1
```

**Subnet Mask**
```
255.255.255.0
```

**DNS**
```
192.168.2.1
```


### How to setup LAN environment
Setup LAN as Static and NOT DHCP

IP Address(Router IP address to its own network subsystem)
```
192.168.x.1
```


# Wifi Setup
Lahi lahi diri. wala ko naka setup pero parehas ra na sa modem

# How to set static IP address
to check connection
Open CMD and type `ipconfig` to see your IP
if the Default Gateway is the same then you are in the same network

# Setup Static IP
- open `file explorer`
- on the side bar right click `Network` and then click `Properties`
- on the side bar, click `Change adapter settings` and open `Ethernet`
- on the bottom click on `Properties`, find `IPv4` and open that.


| Type            | Values        | Meaning                               |
| --------------- | ------------- | ------------------------------------- |
| IP Address      | 192.168.x.x   | This is the IP address of your device |
| Subnet Mask     | 255.255.255.0 | This is the ____                      |
| Default Gateway | 192.168.x.x   | This is where your devices talk       |
| DNS             | 192.168.2.1   | This is where your data is going      |

### Testing
To test the connection type `ping [ip address of 2nd pc]`
> [!EXAMPLE]
> **PC1**: `192.168.1.2`
> **PC2**: `192.168.1.3`
> 
> Scenario: PC1 Pings PC2
> PC1 Command: `ping 192.168.1.3` 
> 
> **Output**
> ```
> Pinging 192.168.1.3 with 32 bytes of data:
> Reply from 192.168.1.3: bytes=32 time=1065ms TTL=128
> Reply from 192.168.1.3: bytes=32 time=21ms TTL=128
> Reply from 192.168.1.3: bytes=32 time=34ms TTL=128
> Reply from 192.168.1.3: bytes=32 time=154ms TTL=128
>
> Ping statistics for 192.168.1.3:
> Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
> Approximate round trip times in milli-seconds:
> Minimum = 21ms, Maximum = 1065ms, Average = 318ms
> ```
# How to perform File Sharing
# How to perform Remote Desktop
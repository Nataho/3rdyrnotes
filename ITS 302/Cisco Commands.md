---
cssclasses:
  - wide
---

# Cisco Commands
## Enable Switch
**prompt:** `Switch>`
```bash
enable
```

## access configuration commands
**prompt:** `Switch#`
```bash
configure terminal
```

## create and configure vlan
**prompt:** `Switch(config)#`
```bash
vlan [vlan number]
```
> [!tip] Example
> prompt changes to `Switch(config-vlan)#` after you type the vlan command
> ```cisco
> vlan 200
> ```

## rename vlan
**prompt:** `Switch(config-vlan)#`
```cisco
name [vlan name]
```
> [!tip] example
> ```cisco
> name FACULTY
> ```

## enter vlan interface and setup vlan ip address
enter vlan interface
**prompt:** `Switch(config)#`
```cisco
interface vlan [vlan number]
```
setup vlan ip address
**prompt:** `Switch(config-if)#`
```bash
ip address [ip address] [subnet mask]
```

> [!tip] example
> ```cisco
> Switch(config)#         interface vlan 200
> Switch(config-if)#      ip address 192.168.5.1 255.255.255.0
> ```

after this you do [[#setup for exit]](click me).

## enter ethernet port interface
**prompt:** `Switch(config)#`
```cisco
interface [port type] [port number]
```
> [!tip] example
> ```
> interface GigabitEthernet 0/1
> ```

## configure switchport to be mode trunk
**prompt:** `Switch(config-if)#`
```cisco
switchport trunk encapsulation dot1q
```

```cisco
switchport mode trunk
```

> [!quote] result
> ```cisco
> Switch(config-if)#      switchport mode trunk
> 
> Switch(config-if)# 
> 
> %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to down
> 
> %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to up
> 
> %LINEPROTO-5-UPDOWN: Line protocol on Interface Vlan200, changed state to up
> 
> %LINEPROTO-5-UPDOWN: Line protocol on Interface Vlan300, changed state to up
> ```

after this, do [[#setup for exit]].

> [!warning] this trunk config is only for the main switch (3560)
> the lower switch (2950T-24) only supports 802.1Q, so `switchport trunk encapsulation dot1q` does not exist on it. on the 2950 just do `switchport mode trunk` (see [[#configure trunk on the second switch]]).

after that, the main switch will show up with these vlans
![[Pasted image 20261022090540.png]]


## setup for exit
do these series of steps when exiting
you start at `Switch(config-if)#` — after `exit` the prompt changes to `Switch(config)#`, that's normal
```cisco
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## configure trunk on the second switch
on the lower switch (2950T-24), enter the port connected to the main switch
**prompt:** `Switch(config)#`
```cisco
interface gigabitEthernet 0/1
```

> [!warning] no encapsulation command here
> the 2950 only supports 802.1Q so `switchport trunk encapsulation dot1q` does not exist on it. just do:
**prompt:** `Switch(config-if)#`
```cisco
switchport mode trunk
```

after this, do [[#setup for exit]].

## create the vlans on the second switch
the second switch needs the same vlans (create them manually, vtp may sync them over the trunk but doing it by hand is safer for the lab)
```cisco
Switch(config)#         vlan 200
Switch(config-vlan)#    name FACULTY
Switch(config-vlan)#    exit
Switch(config)#         vlan 300
Switch(config-vlan)#    name STUDENT
Switch(config-vlan)#    exit
```

## assign access ports to vlans
this is what actually puts the pcs inside the vlans. enter the fast ethernet port each pc is connected to

> [!note] check your ports first
> hover over the cable ends on the topology or run `show ip interface brief` on the lower switch to see which fast ethernet port each pc is actually plugged into

pc0 port → vlan 200:
```cisco
Switch(config)#         interface fastEthernet 0/1
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 200
```

pc1 port → vlan 300:
```cisco
Switch(config)#         interface fastEthernet 0/2
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 300
```

after each one, do [[#setup for exit]].

## setup pc ip addresses
click the pc → **desktop** tab → **ip configuration** → set to static

| pc | ip address | subnet mask | default gateway |
|----|-----------|-------------|-----------------|
| PC0 | 192.168.5.10 | 255.255.255.0 | 192.168.5.1 |
| PC1 | 192.168.10.10 | 255.255.255.0 | 192.168.10.1 |

> [!tip] the gateway is the svi ip of that vlan on the main switch
> Vlan200 = `192.168.5.1` (FACULTY), Vlan300 = `192.168.10.1` (STUDENT)

## enable ip routing (optional)
only needed on the **main switch (3560)** if you want pc0 and pc1 to talk to each other across vlans (inter-vlan routing). the 3560 does not route between svis by default
**prompt:** `Switch(config)#`
```cisco
ip routing
```

## verify
on the switches:
**prompt:** `Switch#` (privileged exec, not config mode — if you're stuck in config, type `exit` or `end` first)
```cisco
show vlan brief
show interfaces trunk
show ip interface brief
```

from a pc (desktop → command prompt):
```bash
ping 192.168.10.10
```

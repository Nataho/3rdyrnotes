---
cssclasses:
  - wide
---

> [!example] Scenario
> Create 2 Vlans from the main switch and let the other switch be configured too and let pc0 access one vlan and pc1 access the other vlan
> 
> VLAN 200 FACULTY
> VLAN 300 STUDENT

# How to start
## prepare 2 switches
1. ![[Pasted image 20261022080949.png]]
2. ![[Pasted image 20261022081039.png]]

## Prepare 2 pcs
![[Pasted image 20261022081135.png]]

## connect 2 switches on gigabit Ethernet
connect both using a cross over cable
![[Pasted image 20261022081259.png]]![[Pasted image 20261022081350.png]]

## connect both pcs to lower switch
connect pc0 and pc1 to lower switch using a straight through cable on any **fast ethernet** port
![[Pasted image 20261022081542.png]]
the tree should look like this

# the setup
before anything, remember the exit ritual you'll do over and over: `no shutdown` → `exit` → `do wr` — [[Cisco Commands#setup for exit | exit guide]]

## enter the main switch (3560)
click the switch → **cli** tab, then — [[Cisco Commands#Enable Switch | enable guide]], [[Cisco Commands#access configuration commands | configure terminal guide]]
```cisco
Switch>                 enable
Switch#                 configure terminal
Switch(config)#
```

# main switch (3560)
## create vlan 200 first
create it and give it its name — [[Cisco Commands#create and configure vlan | create vlan guide]], [[Cisco Commands#rename vlan | rename vlan guide]]
```cisco
Switch(config)#         vlan 200
Switch(config-vlan)#    name FACULTY
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

then give vlan 200 its svi (the gateway ip for that whole vlan) — [[Cisco Commands#enter vlan interface and setup vlan ip address | vlan interface + ip address guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface vlan 200
Switch(config-if)#      ip address 192.168.5.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create vlan 300 after
same pair of commands as vlan 200 — [[Cisco Commands#create and configure vlan | create vlan guide]], [[Cisco Commands#rename vlan | rename vlan guide]]
```cisco
Switch(config)#         vlan 300
Switch(config-vlan)#    name STUDENT
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

then the svi for vlan 300 — [[Cisco Commands#enter vlan interface and setup vlan ip address | vlan interface + ip address guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface vlan 300
Switch(config-if)#      ip address 192.168.10.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

> [!tip] after the vlan 300 svi you'll see the link up messages like this
> `%LINK-5-CHANGED: Interface Vlan300, changed state to up`

## trunk on the main switch (3560)
enter the gigabit port that points at the 2950, then trunk it — [[Cisco Commands#enter ethernet port interface | enter interface guide]], [[Cisco Commands#configure switchport to be mode trunk | trunk guide]], [[Cisco Commands#setup for exit | exit guide]]
> [!warning] the `encapsulation dot1q` line is only needed/possible on the 3560
```cisco
Switch(config)#         interface gigabitEthernet 0/1
Switch(config-if)#      switchport trunk encapsulation dot1q
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

after this the main switch side is done — it should show Vlan200 and Vlan300 up in `show ip interface brief`

# second switch (2950)
## enter the second switch
it's a different device, so you have to enable + configure terminal on it again:
```cisco
Switch>                 enable
Switch#                 configure terminal
Switch(config)#
```

> [!note] check the pc ports first
> hover the cable ends or run `show ip interface brief` to see which fast ethernet ports pc0/pc1 are actually plugged into — we use Fa0/1 and Fa0/2 below

## trunk on the second switch (2950)
the 2950 only supports 802.1Q so there is **no** `switchport trunk encapsulation` command here — just mode trunk. [[Cisco Commands#configure trunk on the second switch | second switch trunk guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface gigabitEthernet 0/1
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create vlan 200 on the second switch
the 2950 needs its own copy of the vlans (vtp may sync them over the trunk, but making them by hand is safer) — [[Cisco Commands#create the vlans on the second switch | second switch vlan guide]]
```cisco
Switch(config)#         vlan 200
Switch(config-vlan)#    name FACULTY
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

## create vlan 300 on the second switch
same as vlan 200 above — [[Cisco Commands#create the vlans on the second switch | second switch vlan guide]]
```cisco
Switch(config)#         vlan 300
Switch(config-vlan)#    name STUDENT
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

## access ports — 2 things to assign
### pc0's port → vlan 200
enter the fast ethernet port pc0 is on, make it an access port and put it in vlan 200 — [[Cisco Commands#assign access ports to vlans | access port guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface fastEthernet 0/1
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 200
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

### pc1's port → vlan 300
same access block, different port and vlan — [[Cisco Commands#assign access ports to vlans | access port guide]]
```cisco
Switch(config)#         interface fastEthernet 0/2
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 300
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

# the pcs
## set the ips — 2 things to configure
click the pc → **desktop** tab → **ip configuration** → static — [[Cisco Commands#setup pc ip addresses | pc ip setup guide]]

pc0 (vlan 200/FACULTY):
| field | value |
|-------|-------|
| ip address | 192.168.5.10 |
| subnet mask | 255.255.255.0 |
| default gateway | 192.168.5.1 |

pc1 (vlan 300/STUDENT):
| field | value |
|-------|-------|
| ip address | 192.168.10.10 |
| subnet mask | 255.255.255.0 |
| default gateway | 192.168.10.1 |

> [!tip] the gateway is the svi ip of that vlan on the main switch — that's what you configured earlier

# main switch again (optional but do it)
## enable ip routing
the 3560 doesn't route between svis by default, so without this pc0 can never ping pc1. go back to the 3560's cli (config mode) and turn routing on — [[Cisco Commands#enable ip routing (optional) | ip routing guide]]
```cisco
Switch(config)#         ip routing
Switch(config)#         do wr
```

# verify
make sure you're at `Switch#` (privileged exec, not config mode) and run these on **both** switches — [[Cisco Commands#verify | verify guide]]
```cisco
Switch#                 show vlan brief
Switch#                 show interfaces trunk
Switch#                 show ip interface brief
```

then from a pc (desktop → command prompt):
```bash
ping 192.168.10.10
```
first ping may drop 1-2 packets (arp) — run it again, it should pass

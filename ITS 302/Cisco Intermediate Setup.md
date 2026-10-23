---
cssclasses: wide
---


> [!example] Scenario
> Create 3 Vlans from the main switch and let the other switch be configured too and let pc0 access one vlan and pc1 access the other vlan
> 
> VLAN 100 STAFF `192.168.100.1`
> VLAN 200 PRESS `192.168.200.1`
> VLAN 300 ACCOUNTING `192.168.50.1`
> 

# How to start

## prepare 3 switches
1. ![[Pasted image 20261022080949.png]]
2. ![[Pasted image 20261022081039.png]]
3. ![[Pasted image 20261022214452.png]]

## prepare 2 pcs on each sub switch (`2950T`)
![[Pasted image 20261022214628.png]]

## connect all pcs to their respective switches
connect all using straight through cable
![[Pasted image 20261022214744.png]]

> [!tip] configuration
> switch0 `Fa0/1` to pc0 `Fa0`
> switch0 `Fa0/2` to pc1 `Fa0`
> 
> switch1 `Fa0/1` to pc2 `Fa0`
> switch1 `Fa0/2` to pc3 `Fa0`

## connect both switches to main switch
connect both switches using a cross over cable to the main switch on `GigabitEthernet` ports
![[Pasted image 20261022081259.png]]

![[Pasted image 20261022215321.png]]

> [!tip] configuration
> multilayer switch0 `Gib0/1` to switch0 `Gib0/1`
> multilayer switch0 `Gib0/2` to switch1 `Gib0/1`

## add a server and connect it to the multilayer switch
connect server to switch using a straight through cable
![[Pasted image 20261022215738.png]]
> [!tip] configuration
> multilayer switch0 `Fa0/1` to Server0 `Fa0`

## Full tree
![[Pasted image 20261022215937.png]]

# the setup
before anything, remember the exit ritual you'll do over and over: `no shutdown` → `exit` → `do wr` — [[Cisco Commands#setup for exit | exit guide]]

> [!note] who goes where
> pc0 + pc3 → vlan 100 STAFF, pc1 + server0 → vlan 200 PRESS, pc2 → vlan 300 ACCOUNTING

## enter the main switch (3560)
click the switch → **cli** tab, then — [[Cisco Commands#Enable Switch | enable guide]], [[Cisco Commands#access configuration commands | configure terminal guide]]
```cisco
Switch>                 enable
Switch#                 configure terminal
Switch(config)#
```

# main switch (3560)
## create vlan 100 first
create it and give it its name — [[Cisco Commands#create and configure vlan | create vlan guide]], [[Cisco Commands#rename vlan | rename vlan guide]]
```cisco
Switch(config)#         vlan 100
Switch(config-vlan)#    name STAFF
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

then give vlan 100 its svi (the gateway ip for that whole vlan) — [[Cisco Commands#enter vlan interface and setup vlan ip address | vlan interface + ip address guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface vlan 100
Switch(config-if)#      ip address 192.168.100.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create vlan 200 after
same pair of commands as vlan 100 — [[Cisco Commands#create and configure vlan | create vlan guide]], [[Cisco Commands#rename vlan | rename vlan guide]]
```cisco
Switch(config)#         vlan 200
Switch(config-vlan)#    name PRESS
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

then the svi for vlan 200 — [[Cisco Commands#enter vlan interface and setup vlan ip address | vlan interface + ip address guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface vlan 200
Switch(config-if)#      ip address 192.168.200.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create vlan 300 last
same pair again — [[Cisco Commands#create and configure vlan | create vlan guide]], [[Cisco Commands#rename vlan | rename vlan guide]]
```cisco
Switch(config)#         vlan 300
Switch(config-vlan)#    name ACCOUNTING
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

then the svi for vlan 300 — [[Cisco Commands#enter vlan interface and setup vlan ip address | vlan interface + ip address guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface vlan 300
Switch(config-if)#      ip address 192.168.50.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

> [!tip] after the vlan 300 svi you'll see the link up messages like this
> `%LINK-5-CHANGED: Interface Vlan300, changed state to up`

## trunk on the main switch (3560)
this time **two** gigabit ports get trunked — `Gi0/1` points at switch0 and `Gi0/2` points at switch1, so run the same block twice — [[Cisco Commands#enter ethernet port interface | enter interface guide]], [[Cisco Commands#configure switchport to be mode trunk | trunk guide]], [[Cisco Commands#setup for exit | exit guide]]
> [!warning] the `encapsulation dot1q` line is only needed/possible on the 3560
```cisco
Switch(config)#         interface gigabitEthernet 0/1
Switch(config-if)#      switchport trunk encapsulation dot1q
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

same block for the second port:
```cisco
Switch(config)#         interface gigabitEthernet 0/2
Switch(config-if)#      switchport trunk encapsulation dot1q
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

after this the main switch side is done — it should show Vlan100, Vlan200 and Vlan300 up in `show ip interface brief`

# sub switch 0 (2950T)
this one is `switch0` in the topology

## enter the first sub switch
it's a different device, so you have to enable + configure terminal on it again:
```cisco
Switch>                 enable
Switch#                 configure terminal
Switch(config)#
```

> [!note] check the pc ports first
> hover the cable ends or run `show ip interface brief` to see which fast ethernet ports pc0/pc1 are actually plugged into — we use Fa0/1 and Fa0/2 below

## trunk on sub switch 0
the 2950 only supports 802.1Q so there is **no** `switchport trunk encapsulation` command here — just mode trunk. [[Cisco Commands#configure trunk on the second switch | second switch trunk guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface gigabitEthernet 0/1
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create the 3 vlans on sub switch 0
the 2950 needs its own copy of the vlans (vtp may sync them over the trunk, but making them by hand is safer) — [[Cisco Commands#create the vlans on the second switch | second switch vlan guide]]
```cisco
Switch(config)#         vlan 100
Switch(config-vlan)#    name STAFF
Switch(config-vlan)#    exit
Switch(config)#         vlan 200
Switch(config-vlan)#    name PRESS
Switch(config-vlan)#    exit
Switch(config)#         vlan 300
Switch(config-vlan)#    name ACCOUNTING
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

## access ports on sub switch 0 — 2 things to assign
### pc0's port → vlan 100
enter the fast ethernet port pc0 is on, make it an access port and put it in vlan 100 — [[Cisco Commands#assign access ports to vlans | access port guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface fastEthernet 0/1
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 100
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

### pc1's port → vlan 200
same access block, different port and vlan — [[Cisco Commands#assign access ports to vlans | access port guide]]
```cisco
Switch(config)#         interface fastEthernet 0/2
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 200
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

# sub switch 1 (2950T)
this one is `switch1` in the topology — everything here is the same as sub switch 0, only the access port vlans change

## enter the second sub switch
enable + configure terminal again on this one too:
```cisco
Switch>                 enable
Switch#                 configure terminal
Switch(config)#
```

## trunk on sub switch 1
same trunk block — [[Cisco Commands#configure trunk on the second switch | second switch trunk guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface gigabitEthernet 0/1
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create the 3 vlans on sub switch 1
same block as sub switch 0 — [[Cisco Commands#create the vlans on the second switch | second switch vlan guide]]
```cisco
Switch(config)#         vlan 100
Switch(config-vlan)#    name STAFF
Switch(config-vlan)#    exit
Switch(config)#         vlan 200
Switch(config-vlan)#    name PRESS
Switch(config-vlan)#    exit
Switch(config)#         vlan 300
Switch(config-vlan)#    name ACCOUNTING
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

## access ports on sub switch 1 — 2 things to assign
### pc2's port → vlan 300
same access block, different port and vlan — [[Cisco Commands#assign access ports to vlans | access port guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface fastEthernet 0/1
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 300
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

### pc3's port → vlan 100
same access block one more time — [[Cisco Commands#assign access ports to vlans | access port guide]]
```cisco
Switch(config)#         interface fastEthernet 0/2
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 100
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

# the server (back on the main switch)
the server's port is on the multilayer switch itself, so click back to the 3560's cli (config mode) and make `Fa0/1` an access port in vlan 200 — [[Cisco Commands#enter ethernet port interface | enter interface guide]], [[Cisco Commands#assign access ports to vlans | access port guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface fastEthernet 0/1
Switch(config-if)#      switchport mode access
Switch(config-if)#      switchport access vlan 200
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

# the pcs (and the server)
## set the ips — 5 devices to configure
click the device → **desktop** tab → **ip configuration** → static — [[Cisco Commands#setup pc ip addresses | pc ip setup guide]]

| device | vlan | ip address | subnet mask | default gateway |
|--------|------|------------|-------------|-----------------|
| pc0 | 100 STAFF | 192.168.100.10 | 255.255.255.0 | 192.168.100.1 |
| pc1 | 200 PRESS | 192.168.200.10 | 255.255.255.0 | 192.168.200.1 |
| pc2 | 300 ACCOUNTING | 192.168.50.10 | 255.255.255.0 | 192.168.50.1 |
| pc3 | 100 STAFF | 192.168.100.20 | 255.255.255.0 | 192.168.100.1 |
| server0 | 200 PRESS | 192.168.200.20 | 255.255.255.0 | 192.168.200.1 |

> [!tip] the gateway is the svi ip of that vlan on the main switch — that's what you configured earlier
> pc0 and pc3 (and pc1 + server0) share a vlan, so their ips can't be identical — first device gets `.10`, second gets `.20`

# main switch again (optional but do it)
## enable ip routing
the 3560 doesn't route between svis by default, so without this pc0 can never ping pc2 across vlans. go back to the 3560's cli (config mode) and turn routing on — [[Cisco Commands#enable ip routing (optional) | ip routing guide]]
```cisco
Switch(config)#         ip routing
Switch(config)#         do wr
```

# verify
make sure you're at `Switch#` (privileged exec, not config mode) and run these on **all three** switches — [[Cisco Commands#verify | verify guide]]
```cisco
Switch#                 show vlan brief
Switch#                 show interfaces trunk
Switch#                 show ip interface brief
```

then from a pc (desktop → command prompt):
```bash
ping 192.168.100.20
```
same-vlan test — pc0 (STAFF, switch0) pinging pc3 (STAFF, switch1) goes across the trunks

```bash
ping 192.168.50.10
```
inter-vlan test — pc0 (STAFF) pinging pc2 (ACCOUNTING) needs `ip routing` on

first ping may drop 1-2 packets (arp) — run it again, it should pass. ping `192.168.200.20` too if you want to hit the server
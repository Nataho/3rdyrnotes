---
cssclasses: wide
---


> [!example] Scenario
> same 2 vlan lab as before, but this time the pcs don't get typed ips — the **main switch hands them out over dhcp**
> 
> VLAN 100 STUDENT `192.168.2.1` — pool `192.168.2.0/24`
> VLAN 200 FACULTY `192.168.3.1` — pool `192.168.3.0/24`
> 

# How to start

## prepare the main switch (3560)
![[Pasted image 20261104111321.png]]

## prepare a sub switch (`2960`)
![[Pasted image 20261104111338.png]]

## prepare 2 pcs
![[Pasted image 20261104111355.png]]

## connect both pcs to the sub switch
connect both using a straight through cable on any **fast ethernet** port
![[Pasted image 20261104111409.png]]

> [!tip] configuration
> switch `Fa0/1` to pc0 `Fa0`
> switch `Fa0/2` to pc1 `Fa0`

## connect both switches
connect them using a cross over cable on the **gigabitethernet** ports
![[Pasted image 20261104111433.png]]

> [!tip] configuration
> multilayer switch0 `Gib0/1` to switch `Gib0/1`

## Full tree
![[Pasted image 20261104111447.png]]

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
## create vlan 100 first
create it and give it its name — [[Cisco Commands#create and configure vlan | create vlan guide]], [[Cisco Commands#rename vlan | rename vlan guide]]
```cisco
Switch(config)#         vlan 100
Switch(config-vlan)#    name STUDENT
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

then give vlan 100 its svi (the gateway ip for that whole vlan) — [[Cisco Commands#enter vlan interface and setup vlan ip address | vlan interface + ip address guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface vlan 100
Switch(config-if)#      ip address 192.168.2.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create vlan 200 after
same pair of commands as vlan 100 — [[Cisco Commands#create and configure vlan | create vlan guide]], [[Cisco Commands#rename vlan | rename vlan guide]]
```cisco
Switch(config)#         vlan 200
Switch(config-vlan)#    name FACULTY
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

then the svi for vlan 200 — [[Cisco Commands#enter vlan interface and setup vlan ip address | vlan interface + ip address guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface vlan 200
Switch(config-if)#      ip address 192.168.3.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

> [!tip] after the vlan 200 svi you'll see the link up messages like this
> `%LINK-5-CHANGED: Interface Vlan200, changed state to up`

## trunk on the main switch (3560)
enter the gigabit port that points at the 2960, then trunk it — [[Cisco Commands#enter ethernet port interface | enter interface guide]], [[Cisco Commands#configure switchport to be mode trunk | trunk guide]], [[Cisco Commands#setup for exit | exit guide]]
> [!warning] the `encapsulation dot1q` line is only needed/possible on the 3560
```cisco
Switch(config)#         interface gigabitEthernet 0/1
Switch(config-if)#      switchport trunk encapsulation dot1q
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

after this the main switch switching side is done — it should show Vlan100 and Vlan200 up in `show ip interface brief`

# sub switch (2960)
## enter the sub switch
it's a different device, so you have to enable + configure terminal on it again:
```cisco
Switch>                 enable
Switch#                 configure terminal
Switch(config)#
```

> [!note] check the pc ports first
> hover the cable ends or run `show ip interface brief` to see which fast ethernet ports pc0/pc1 are actually plugged into — we use Fa0/1 and Fa0/2 below

## trunk on the sub switch
the 2960 only supports 802.1Q so there is **no** `switchport trunk encapsulation` command here — just mode trunk. [[Cisco Commands#configure trunk on the second switch | second switch trunk guide]], [[Cisco Commands#setup for exit | exit guide]]
```cisco
Switch(config)#         interface gigabitEthernet 0/1
Switch(config-if)#      switchport mode trunk
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```

## create the 2 vlans on the sub switch
the sub switch needs its own copy of the vlans (vtp may sync them over the trunk, but making them by hand is safer) — [[Cisco Commands#create the vlans on the second switch | second switch vlan guide]]
```cisco
Switch(config)#         vlan 100
Switch(config-vlan)#    name STUDENT
Switch(config-vlan)#    exit
Switch(config)#         vlan 200
Switch(config-vlan)#    name FACULTY
Switch(config-vlan)#    exit
Switch(config)#         do wr
```

## access ports — 2 things to assign
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

> [!warning] do NOT add svis on the sub switch — no `interface vlan 100` / `interface vlan 200` with ip addresses here
> the sub switch is layer 2 only — the 3560 is the **only** device allowed to own `192.168.2.1` / `192.168.3.1`. if both switches hold the same ip:
> - the dhcp server pings an address before leasing it and gets a reply from the sub switch → `%DHCPD-4-PING_CONFLICT: DHCP address conflict: server pinged 192.168.2.1`
> - pcs can't tell which switch answers when they look for the gateway → pings die
> 
> if it already happened, delete the svis on the sub switch (`no interface vlan` removes the ip interface — the vlans, ports and trunk keep working):
> ```cisco
> Switch(config)#         no interface vlan 100
> Switch(config)#         no interface vlan 200
> Switch(config)#         do wr
> ```

# DHCP pools (back on the main switch)
this is the part that makes it a dhcp lab — everything below happens on the **3560's** cli (config mode). click back to the main device first

## exclude the gateway addresses first
a pool leases the whole `/24` starting at `.1` unless told not to — and `.1` is the svi you just made. exclude it on both subnets
**prompt:** `Switch(config)#`
```cisco
Switch(config)#         ip dhcp excluded-address 192.168.2.1
Switch(config)#         ip dhcp excluded-address 192.168.3.1
Switch(config)#         do wr
```

## create the vlan100 pool
**prompt:** `Switch(config)#`
```cisco
ip dhcp pool vlan100
```

the prompt changes to `Switch(dhcp-config)#` — a pool needs 3 things:
```cisco
Switch(dhcp-config)#    network 192.168.2.0 255.255.255.0
Switch(dhcp-config)#    default-router 192.168.2.1
Switch(dhcp-config)#    dns-server 192.168.2.1
Switch(dhcp-config)#    exit
Switch(config)#         do wr
```

> [!tip] what the 3 lines mean
> - `network` — the range being handed out: `192.168.2.0/24` (minus the excluded `.1`)
> - `default-router` — the gateway pushed to the pc = the vlan 100 svi
> - `dns-server` — here it matches the svi too

## create the vlan200 pool
same block, vlan 200 numbers (`default-router` = the vlan 200 svi):
```cisco
Switch(config)#         ip dhcp pool vlan200
Switch(dhcp-config)#    network 192.168.3.0 255.255.255.0
Switch(dhcp-config)#    default-router 192.168.3.1
Switch(dhcp-config)#    dns-server 192.168.3.1
Switch(dhcp-config)#    exit
Switch(config)#         do wr
```

## enable ip routing
same "optional but do it" step as the other labs — without it the pcs can never ping across vlans even with dhcp — [[Cisco Commands#enable ip routing (optional) | ip routing guide]]
```cisco
Switch(config)#         ip routing
Switch(config)#         do wr
```

> [!tip] switched on the pools late, or already saw a `%DHCPD-4-PING_CONFLICT`?
> the server remembers old conflicted addresses. clear the lease table and let the pcs re-request — [[Cisco Commands#verify | verify guide]]
> ```cisco
> Switch#                 clear ip dhcp binding *
> ```

# the pcs
## get the ips via dhcp — 2 devices
click the pc → **desktop** tab → **ip configuration** → select **DHCP** (instead of typing a static set) — [[Cisco Commands#setup pc ip addresses | pc ip setup guide]]

no ip, mask, gateway or dns to type — the pool fills them all in (the pc shows "DHCP request successful"):
| pc | vlan | what it gets |
|----|------|--------------|
| pc0 | 100 STUDENT | `192.168.2.x` / `255.255.255.0` / gateway `192.168.2.1` |
| pc1 | 200 FACULTY | `192.168.3.x` / `255.255.255.0` / gateway `192.168.3.1` |

> [!tip] how to renew a lease
> the exact leased address depends on order, so check it: desktop → **command prompt** → `ipconfig`. if a pc is holding stale settings from an earlier attempt, toggle the radio to static then back to dhcp — that forces a fresh request. don't panic if pc0 keeps `192.168.2.2` and pc1 keeps `192.168.3.2` every time, dhcp reuses the next free address

# verify
on the switches, make sure you're at `Switch#` (privileged exec, not config mode) and run the standard trio on **both** — [[Cisco Commands#verify | verify guide]]
```cisco
Switch#                 show vlan brief
Switch#                 show interfaces trunk
Switch#                 show ip interface brief
```

on the 3560 you can also watch the leases:
```cisco
Switch#                 show ip dhcp binding
```

then from a pc (desktop → command prompt):
```bash
ipconfig
```
shows the leased ip/mask/gateway — pc0 should be `192.168.2.x` with gateway `192.168.2.1`

```bash
ping 192.168.3.2
```
inter-vlan test — pc0 (STUDENT) pinging pc1 (FACULTY) needs `ip routing` on the 3560. if `192.168.3.2` isn't pc1's actual address, ping whatever `ipconfig` showed on pc1

first ping may drop 1-2 packets (arp) — run it again, it should pass. ping `192.168.3.1` too if you want to hit the gateway directly

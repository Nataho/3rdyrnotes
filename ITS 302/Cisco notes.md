---
cssclasses:
  - wide
---

# SVI (Switch Virtual Interface)

> [!info] Definition
> An **SVI (Switch Virtual Interface)** is a virtual layer 3 interface that belongs to an entire VLAN instead of a physical port. It is software-only — there is no physical jack for it — and it exists inside the switch itself.

## what it does
- it is the one interface created **per VLAN**: `interface vlan [number]` creates the SVI for that VLAN
- its IP address is the **gateway for that whole VLAN** — every pc in the vlan points its default gateway at the SVI's IP
- it is also how you give the switch itself a management IP so you can reach it over the network
- on a multilayer switch like the 3560, inter-vlan traffic is routed **between SVIs** — that's why `ip routing` must be on, since the 3560 does not route between SVIs by default

## how you configure it
from the notes — enter the SVI, give it an IP, then the exit ritual:
```cisco
Switch(config)#         interface vlan 200
Switch(config-if)#      ip address 192.168.5.1 255.255.255.0
Switch(config-if)#      no shutdown
Switch(config-if)#      exit
Switch(config)#         do wr
```
- `Switch(config-if)#` is the prompt while inside the SVI
- when the SVI comes up you see `%LINK-5-CHANGED: Interface Vlan200, changed state to up`

> [!example] SVIs from the labs
> | lab | SVI | ip address | gateway for |
> |-----|-----|------------|-------------|
> | basic setup | Vlan200 FACULTY | 192.168.5.1 | pc0 (192.168.5.10) |
> | basic setup | Vlan300 STUDENT | 192.168.10.1 | pc1 (192.168.10.10) |
> | intermediate setup | Vlan100 STAFF | 192.168.100.1 | pc0 + pc3 |
> | intermediate setup | Vlan200 PRESS | 192.168.200.1 | pc1 + server0 |
> | intermediate setup | Vlan300 ACCOUNTING | 192.168.50.1 | pc2 |

## SVI vs physical interface
| | SVI | physical interface (e.g. Fa0/1, Gi0/1) |
|---|-----|------------------------------------------|
| exists per | VLAN | actual port |
| tied to hardware | no — virtual | yes |
| typical use | vlan gateway / management / routing | access port, trunk port |

> [!warning] common exam trap
> creating the VLAN (`vlan 200`) is **not** the same as creating its SVI (`interface vlan 200`). the VLAN is the layer 2 broadcast domain; the SVI is the layer 3 interface on top of it. a VLAN with no SVI has no gateway.

## verify
```cisco
show ip interface brief
```
shows the SVIs as `Vlan200`, `Vlan300`, etc. with their IPs — in the labs they should show up/up after `no shutdown`.

---
sources: [[Cisco Basic Setup]] · [[Cisco Intermediate Setup]] · [[Cisco Commands]]
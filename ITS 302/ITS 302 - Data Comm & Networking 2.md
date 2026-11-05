---
tags:
  - subject
Teacher: "[[Van Roger Gutib]]"
---
# Notes

## [[Cisco Intermediate Setup]]

## [[Cisco Basic Setup]]
the full packet tracer lab walkthrough. starts with the scenario, then how to build the topology (3560 + 2950, crossover between switches, straight-through to the pcs), then every command needed to finish it end to end — vlan 200 then vlan 300 (create + name + svi) on the main switch, trunks on both switches, the same vlans created on the 2950, access ports for pc0/pc1, both pc's ip/gateway setup, optional `ip routing` so the pcs can talk across vlans, and how to verify/ping.

## [[DHCP Basic Setup]]
the dhcp version of the two-vlan lab. same 3560 + 2960 topology and same STUDENT/FACULTY svis, but the main switch serves the ip addresses itself: `ip dhcp excluded-address` for the gateways, pools `vlan100`/`vlan200` with `network` + `default-router` + `dns-server`, `ip routing`, and the pcs set to dhcp in packet tracer. carries the debugging lesson from this run — no `interface vlan` svis on the sub switch, because a duplicate `192.168.x.1` triggers `%DHCPD-4-PING_CONFLICT` and kills pings (fix: `no interface vlan 100/200`, `clear ip dhcp binding *`, renew on the pcs).

## [[Cisco Commands]]
the raw cisco command reference the setup pulls from. every command shows the prompt you should see before typing it (`Switch>`, `Switch(config)#`, `Switch(config-if)#`...), with working examples (vlan 200/faculty), per-device warnings (the 3560 needs `switchport trunk encapsulation dot1q`, the 2950 doesn't support it), the `no shutdown`/`exit`/`do wr` exit ritual, and the trunk/vlan/verify commands.

[[routers]]


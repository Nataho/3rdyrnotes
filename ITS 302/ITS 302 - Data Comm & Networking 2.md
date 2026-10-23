---
tags:
  - subject
Teacher: "[[Van Roger Gutib]]"
---
# Notes

## [[Cisco Intermediate Setup]]

## [[Cisco Basic Setup]]
the full packet tracer lab walkthrough. starts with the scenario, then how to build the topology (3560 + 2950, crossover between switches, straight-through to the pcs), then every command needed to finish it end to end — vlan 200 then vlan 300 (create + name + svi) on the main switch, trunks on both switches, the same vlans created on the 2950, access ports for pc0/pc1, both pc's ip/gateway setup, optional `ip routing` so the pcs can talk across vlans, and how to verify/ping.

## [[Cisco Commands]]
the raw cisco command reference the setup pulls from. every command shows the prompt you should see before typing it (`Switch>`, `Switch(config)#`, `Switch(config-if)#`...), with working examples (vlan 200/faculty), per-device warnings (the 3560 needs `switchport trunk encapsulation dot1q`, the 2950 doesn't support it), the `no shutdown`/`exit`/`do wr` exit ritual, and the trunk/vlan/verify commands.

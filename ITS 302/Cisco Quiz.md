# Cisco Quiz

Self-test built from [[Cisco Basic Setup]], [[Cisco Intermediate Setup]], [[Cisco Commands]], and [[DHCP Basic Setup]].

> [!success] Score: 15/20 - 75%

> [!question] 1. Which command moves you from `Switch>` to `Switch#`?
> - [ ] A. configure terminal
> - [x] B. enable
> - [ ] C. do wr
> - [ ] D. exit
>
> Answer:
> ```
>
> ```

> [!check] 1. Correct - enable

> [!question] 2. After typing `configure terminal`, what prompt do you see?
> - [ ] A. `Switch>`
> - [ ] B. `Switch#`
> - [x] C. `Switch(config)#`
> - [ ] D. `Switch(config-if)#`
>
> Answer:
> ```
>
> ```

> [!check] 2. Correct - Switch(config)#

> [!question] 3. Which device requires the command `switchport trunk encapsulation dot1q`?
> - [ ] A. the 2950T-24 switch only
> - [ ] B. the 2960 switch only
> - [x] C. the 3560 main (multilayer) switch
> - [ ] D. both switches equally
>
> Answer:
> ```
>
> ```

> [!check] 3. Correct - the 3560 main (multilayer) switch, because only it needs/supports the dot1q encapsulation command

> [!question] 4. Which sequence describes the exit ritual done after configuring an interface?
> - [ ] A. `do wr` → `exit` → `no shutdown`
> - [ ] B. `exit` → `do wr` → `no shutdown`
> - [x] C. `no shutdown` → `exit` → `do wr`
> - [ ] D. `shutdown` → `exit` → `write`
>
> Answer:
> ```
>
> ```

> [!check] 4. Correct - no shutdown → exit → do wr

> [!question] 5. Which cable type connects a PC to a switch (fast ethernet port)?
> - [ ] A. cross-over cable
> - [x] B. straight through cable
> - [ ] C. console cable
> - [ ] D. serial cable
>
> Answer:
> ```
>
> ```

> [!check] 5. Correct - straight through cable

> [!question] 6. In the Cisco Basic Setup lab, which VLAN is PC0 assigned to through its access port?
> - [x] A. VLAN 100 STAFF
> - [ ] B. VLAN 200 FACULTY
> - [ ] C. VLAN 300 STUDENT
> - [ ] D. VLAN 300 ACCOUNTING
>
> Answer:
> ```
>
> ```

> [!fail] 6. Wrong - you picked VLAN 100 STAFF; correct is VLAN 200 FACULTY, because PC0's access port is put in VLAN 200 in the Basic Setup lab (VLAN 100 STAFF belongs to the Intermediate/DHCP labs, not Basic Setup).

> [!question] 7. Which three lines does a DHCP pool need after `ip dhcp pool [name]`?
> - [x] A. `network`, `default-router`, `dns-server`
> - [ ] B. `ip address`, `subnet mask`, `gateway`
> - [ ] C. `interface`, `excluded-address`, `route`
> - [ ] D. `vlan`, `name`, `svi`
>
> Answer:
> ```
>
> ```

> [!check] 7. Correct - network, default-router, dns-server

> [!question] 8. In the Cisco Basic Setup lab, what should PC0's default gateway be set to?
> - [ ] A. PC1's IP address
> - [ ] B. the switch's own IP
> - [ ] C. the SVI IP of VLAN 200 on the main switch
> - [x] D. 192.168.10.1
>
> Answer:
> ```
>
> ```

> [!fail] 8. Wrong - you picked 192.168.10.1; correct is 192.168.5.1 — the SVI IP of VLAN 200 on the main switch. 192.168.10.1 is the VLAN 300 gateway, which belongs to PC1, not PC0.

> [!question] 9. True or False: the 2950 switch supports the command `switchport trunk encapsulation dot1q`.
> - [ ] True
> - [x] False
>
> Answer:
> ```
>
> ```

> [!check] 9. Correct - False, the 2950 only supports 802.1Q so the encapsulation command does not exist on it

> [!question] 10. True or False: in the labs, the two switches are connected using a cross-over cable on the GigabitEthernet ports.
> - [x] True
> - [ ] False
>
> Answer:
> ```
>
> ```

> [!check] 10. Correct - True

> [!question] 11. True or False: the 3560 routes between SVIs by default, so `ip routing` is never needed.
> - [ ] True
> - [x] False
>
> Answer:
> ```
>
> ```

> [!check] 11. Correct - False, the 3560 does not route between SVIs by default, so `ip routing` is needed

> [!question] 12. True or False: when pinging between two PCs for the first time, the first ping may drop 1-2 packets because of ARP.
> - [x] True
> - [ ] False
>
> Answer:
> ```
>
> ```

> [!check] 12. Correct - True

> [!question] 13. Identification: type the exact command (at `Switch(config)#`) to create VLAN 200.
> ```
> vlan 200
> ```

> [!check] 13. Correct - vlan 200

> [!question] 14. Identification: at the `Switch(config-vlan)#` prompt, which command names the VLAN FACULTY?
> ```
> name faculty
> ```

> [!check] 14. Correct - name faculty (the notes type `name FACULTY`)

> [!question] 15. Identification: at `Switch(config)#`, which command saves your configuration?
> ```
>do wr
> ```

> [!check] 15. Correct - do wr

> [!question] 16. Identification: after `switchport mode access`, which command puts the current fast ethernet port into VLAN 300?
> ```
>switchport access vlan 300
> ```

> [!check] 16. Correct - switchport access vlan 300

> [!question] 17. Identification: which `show` command (run at `Switch#`) lists all VLANs and their ports?
> ```
> 
> ```

> [!fail] 17. Wrong - the answer field was blank; correct is `show vlan brief`.

> [!question] 18. Identification: which `show` command displays the trunk interfaces?
> ```
> 
> ```

> [!fail] 18. Wrong - the answer field was blank; correct is `show interfaces trunk`.

> [!question] 19. Identification: which command (at `Switch(config)#` on the 3560) enables inter-VLAN routing?
> ```
> ip routing
> ```

> [!check] 19. Correct - ip routing

> [!question] 20. Identification: which command prevents the DHCP server from leasing the SVI address 192.168.2.1 to other devices?
> ```
>
> ```

> [!fail] 20. Wrong - the answer field was blank; correct is `ip dhcp excluded-address 192.168.2.1`.

Ask the AI to evaluate your answers when you're done.
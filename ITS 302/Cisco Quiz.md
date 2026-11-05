# Cisco Quiz

Self-test built from [[Cisco Basic Setup]], [[Cisco Intermediate Setup]], [[Cisco Commands]], and [[DHCP Basic Setup]].

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

> [!question] 9. True or False: the 2950 switch supports the command `switchport trunk encapsulation dot1q`.
> - [ ] True
> - [x] False
>
> Answer:
> ```
>
> ```

> [!question] 10. True or False: in the labs, the two switches are connected using a cross-over cable on the GigabitEthernet ports.
> - [x] True
> - [ ] False
>
> Answer:
> ```
>
> ```

> [!question] 11. True or False: the 3560 routes between SVIs by default, so `ip routing` is never needed.
> - [ ] True
> - [x] False
>
> Answer:
> ```
>
> ```

> [!question] 12. True or False: when pinging between two PCs for the first time, the first ping may drop 1-2 packets because of ARP.
> - [x] True
> - [ ] False
>
> Answer:
> ```
>
> ```

> [!question] 13. Identification: type the exact command (at `Switch(config)#`) to create VLAN 200.
> ```
> vlan 200
> ```

> [!question] 14. Identification: at the `Switch(config-vlan)#` prompt, which command names the VLAN FACULTY?
> ```
> name faculty
> ```

> [!question] 15. Identification: at `Switch(config)#`, which command saves your configuration?
> ```
>do wr
> ```

> [!question] 16. Identification: after `switchport mode access`, which command puts the current fast ethernet port into VLAN 300?
> ```
>switchport access vlan 300
> ```

> [!question] 17. Identification: which `show` command (run at `Switch#`) lists all VLANs and their ports?
> ```
> 
> ```

> [!question] 18. Identification: which `show` command displays the trunk interfaces?
> ```
> 
> ```

> [!question] 19. Identification: which command (at `Switch(config)#` on the 3560) enables inter-VLAN routing?
> ```
> ip routing
> ```

> [!question] 20. Identification: which command prevents the DHCP server from leasing the SVI address 192.168.2.1 to other devices?
> ```
>
> ```

Ask the AI to evaluate your answers when you're done.
// CLI Templates per vendor for OmniTopology terminal emulation

export interface CliTemplate {
  welcome: string;
  prompt: string | ((cliState: any) => string);
  commands: Record<string, (args: string[], data: any, cliState?: any, setCliState?: (s: any) => void, updateField?: (f: string, v: any) => void) => string>;
  parseCommand?: (cmd: string, data: any, cliState: any, setCliState: (s: any) => void, updateField: (f: string, v: any) => void) => string | null;
}

const hostname = (data: any) => data?.hostname || "device";

export const CISCO_CLI: CliTemplate = {
  welcome: `
Cisco IOS Software, Version 15.7(3)M, RELEASE SOFTWARE (fc2)
Copyright (c) 1986-2019 by Cisco Systems, Inc.
Type 'help' for a list of available commands.
`,
  prompt: (s) => {
    if (s?.mode === "priv") return "# ";
    if (s?.mode === "config") return "(config)# ";
    if (s?.mode === "config-if") return "(config-if)# ";
    return "> ";
  },
  parseCommand: (cmd, data, cliState, setCliState, updateField) => {
    const parts = cmd.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    
    const mode = cliState?.mode || "user";

    // Modos de entrada/saida
    if (cmd === "enable") { setCliState({ ...cliState, mode: "priv" }); return ""; }
    if (cmd === "disable") { setCliState({ ...cliState, mode: "user" }); return ""; }
    if (cmd === "configure terminal" || cmd === "conf t") {
      if (mode !== "priv") return "Command not allowed here.";
      setCliState({ ...cliState, mode: "config" }); return "Enter configuration commands, one per line.  End with CNTL/Z.";
    }
    if (cmd === "exit") {
      if (mode === "config-if") setCliState({ ...cliState, mode: "config", currentIf: null });
      else if (mode === "config") setCliState({ ...cliState, mode: "priv" });
      else if (mode === "priv") setCliState({ ...cliState, mode: "user" });
      return "";
    }
    if (cmd === "end") {
      setCliState({ ...cliState, mode: "priv", currentIf: null }); return "";
    }

    // Comandos de configuração global
    if (mode === "config") {
      if (parts[0] === "hostname" && parts[1]) {
        updateField("hostname", parts[1]);
        return "";
      }
      if (parts[0] === "interface" && parts[1]) {
        setCliState({ ...cliState, mode: "config-if", currentIf: parts[1] });
        return "";
      }
    }

    // Comandos de configuração de interface
    if (mode === "config-if" && cliState.currentIf) {
      if (parts[0] === "ip" && parts[1] === "address" && parts[2]) {
        // Encontra ou cria a interface
        let ifaces = [...(data.interfaces || [])];
        let idx = ifaces.findIndex((i: any) => i.name === cliState.currentIf);
        if (idx === -1) {
          ifaces.push({ name: cliState.currentIf, ip: "", mode: "access", vlan: "1" });
          idx = ifaces.length - 1;
        }
        // formato ex: 192.168.1.1 255.255.255.0. No nosso sistema usamos CIDR ou apenas IP
        ifaces[idx].ip = parts[2]; 
        updateField("interfaces", ifaces);
        return "";
      }
      if (parts[0] === "no" && parts[1] === "shutdown") {
        return ""; // Apenas ignora e da ok no simulador visual
      }
    }

    return null; // fallback para os commands estáticos
  },
  commands: {
    help: () => `
Available commands:
  enable               - Enter privileged mode
  show version         - Display IOS version information
  show ip interface brief - Show interface summary
  show running-config  - Display running configuration
  show ip route        - Display routing table
  configure terminal   - Enter configuration terminal
  interface [name]     - Enter interface configuration
  ip address [ip] [mask] - Set interface IP
  hostname [name]      - Set device hostname
  exit                 - Exit current mode
  clear                - Clear terminal
`,
    "show version": (_, d) => `
Cisco IOS Software, Version 15.7(3)M
Hostname: ${hostname(d)}
Uptime: 1 day, 2 hours, 30 minutes
Processor: Cisco RISC Processor rev 1
Memory: 512K bytes of non-volatile configuration memory
Flash: 256M bytes total`,
    "show ip interface brief": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "\nInterface              IP-Address      OK? Method Status    Protocol\n";
      ifaces.forEach((i: any) => {
        out += `${i.name.padEnd(22)} ${(i.ip || "unassigned").padEnd(16)} YES manual ${i.status || "up"} up\n`;
      });
      return out;
    },
    "show running-config": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = `Building configuration...

Current configuration : 1024 bytes
!
version 15.7
service timestamps debug datetime msec
!
hostname ${hostname(d)}
!
`;
      ifaces.forEach((i: any) => {
        out += `interface ${i.name}\n`;
        if (i.ip) out += ` ip address ${i.ip} 255.255.255.0\n`;
        else out += ` no ip address\n`;
        out += ` no shutdown\n!\n`;
      });
      out += `end`;
      return out;
    },
    "show ip route": () => `
Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP

Gateway of last resort is not set`,
  },
};

export const MIKROTIK_CLI: CliTemplate = {
  welcome: `
  MMM      MMM       KKK                    TTTTTTTTTTT      KKK
  MMMM    MMMM       KKK                        TTT          KKK
  MMM MMMM MMM  IIIII KKK  KKK  RRRRRR    OOOOOO TTT  IIIII KKK  KKK
  MMM  MM  MMM  IIIII KKKKK     RRR  RRR OOO  OOO TTT  IIIII KKKKK
  MMM      MMM  IIIII KKK KKK   RRRRRR   OOO  OOO TTT  IIIII KKK KKK
  MMM      MMM  IIIII KKK  KKK  RRR  RRR  OOOOOO  TTT  IIIII KKK  KKK

  MikroTik RouterOS 7.14 (c) 2024

  Type '?' for help
`,
  prompt: "> ",
  commands: {
    "?": () => `
General commands:
  /ip address print        - List IP addresses
  /ip route print          - Show routing table
  /interface print         - List interfaces
  /system identity print   - Show hostname
  /system resource print   - Show system resources
  /ip firewall filter print - Show firewall rules
  /ip dns print            - Show DNS settings
`,
    "/ip address print": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "Flags: X - disabled, I - invalid, D - dynamic\n";
      out += " #   ADDRESS            NETWORK         INTERFACE\n";
      let count = 0;
      ifaces.forEach((i: any) => {
        if (i.ip) {
          out += ` ${count++}   ${(i.ip).padEnd(18)} ${(i.network || "").padEnd(15)} ${i.name}\n`;
        }
      });
      return out;
    },
    "/interface print": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "Flags: D - dynamic, X - disabled, R - running, S - slave\n";
      out += " #  R  NAME             TYPE       ACTUAL-MTU L2MTU MAX-L2MTU\n";
      ifaces.forEach((i: any, idx: number) => {
        out += ` ${idx}  R  ${i.name.padEnd(15)} ${(i.type || "ether").padEnd(10)} 1500       1598  65535\n`;
      });
      return out;
    },
    "/system identity print": (_, d) => `   name: ${hostname(d)}`,
    "/system resource print": (_, d) => `
           uptime: 1d2h30m
      free-memory: 512.0MiB
     total-memory: 1024.0MiB
              cpu: ARM
        cpu-count: 4
         cpu-load: 2%
 free-hdd-space: 8.0GiB
total-hdd-space: 16.0GiB
  board-name: ${d?.model || "RB4011iGS+5HacQ2HnD"}
        version: 7.14`,
    "/ip route print": () => `
Flags: X - disabled, A - active, D - dynamic, C - connect, S - static, r - rip, b - bgp, o - ospf

 #      DST-ADDRESS        PREF-SRC          GATEWAY            DISTANCE`,
    "/ip firewall filter print": () => `
Flags: X - disabled, I - invalid, D - dynamic
 #  CHAIN           ACTION    PROTO SRC-ADDRESS    DST-ADDRESS
 0  input           accept    tcp                               (established,related)
 1  forward         fasttrack                                   (established,related)
 2  input           drop`,
    "/ip dns print": () => `
        servers: 8.8.8.8,1.1.1.1
  dynamic-servers:
   use-doh-server:
        verify-doh-cert: no
        allow-remote-requests: yes`,
  },
};

export const PFSENSE_CLI: CliTemplate = {
  welcome: `
pfSense CE 2.7.2
Netgate Device ID: abc123

*** Welcome to pfSense CLI ***
  0) Logout (SSH only)
  1) Assign Interfaces
  2) Set interface(s) IP address
  3) Reset webConfigurator password
  4) Reset to factory defaults
  5) Reboot system
  6) Halt system
  7) Ping host
  8) Shell
  9) pfTop
  10) Filter Logs
  11) Restart webConfigurator
  12) PHP shell + pfSense tools
  16) Restart PHP-FPM

Enter an option:
`,
  prompt: "$ ",
  commands: {
    "8": () => "Entering shell...\n[2.7.2-RELEASE][root@pfSense]/: ",
    ifconfig: (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "";
      ifaces.forEach((i: any) => {
        out += `${i.name}: flags=8843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> metric 0 mtu 1500\n`;
        if (i.ip) out += `\tinet ${i.ip.split('/')[0]} netmask 0xffffff00 broadcast 255.255.255.255\n`;
      });
      return out;
    },
    "netstat -rn": () => `Routing tables\n\nInternet:\nDestination        Gateway            Flags   Netif Expire`,
    help: () => `
pfSense Shell Commands:
  ifconfig          - Show network interfaces
  netstat -rn       - Show routing table
  pfctl -sa         - Show all pf rules
  top               - Process monitor
  clear             - Clear screen`,
  },
};

export const LINUX_CLI: CliTemplate = {
  welcome: `
Ubuntu Server 22.04.3 LTS

Welcome to OmniTopology Linux Node!
Type 'help' for available commands.
`,
  prompt: "$ ",
  commands: {
    help: () => `
Available simulation commands:
  ip addr show         - Show IP addresses
  ip route show        - Show routing table
  ifconfig             - Legacy interface info
  ss -tuln             - Show listening ports
  ping [host]          - Simulate ping
  df -h                - Disk usage
  free -h              - Memory usage
  uname -a             - Kernel info`,
    "ip addr show": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "";
      ifaces.forEach((i: any, idx: number) => {
        out += `${idx + 1}: ${i.name}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n`;
        out += `    link/ether ${i.mac || "02:42:ac:11:00:0" + (idx + 2)} brd ff:ff:ff:ff:ff:ff\n`;
        if (i.ip) {
          out += `    inet ${i.ip} brd ${i.broadcast || "255.255.255.255"} scope global dynamic ${i.name}\n`;
        }
        out += `\n`;
      });
      return out;
    },
    "ip route show": () => ``,
    "uname -a": () =>
      `Linux server 5.15.0-88-generic #98-Ubuntu SMP Mon Oct 2 15:18:56 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux`,
    "free -h": () => `
               total        used        free      shared  buff/cache   available
Mem:           15Gi        2.5Gi        10Gi       234Mi        2.4Gi        12Gi
Swap:         2.0Gi          0B        2.0Gi`,
    "df -h": () => `
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   12G   36G  25% /
tmpfs           7.7G     0  7.7G   0% /dev/shm`,
  },
};

export const WINDOWS_CLI: CliTemplate = {
  welcome: `
Microsoft Windows [Version 10.0.20348.169]
(c) Microsoft Corporation. All rights reserved.
`,
  prompt: ">",
  commands: {
    help: () => `
For more information on a specific command, type HELP command-name
  IPCONFIG       Displays all current TCP/IP network configuration values.
  PING           Verifies IP-level connectivity to another TCP/IP computer.
  ROUTE          Manipulates network routing tables.
  SYSTEMINFO     Displays machine specific properties and configuration.`,
    ipconfig: (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "\nWindows IP Configuration\n\n";
      ifaces.forEach((i: any) => {
        out += `Ethernet adapter ${i.name}:\n\n`;
        out += `   Connection-specific DNS Suffix  . : localdomain\n`;
        if (i.ip) {
          out += `   IPv4 Address. . . . . . . . . . . : ${i.ip.split('/')[0]}\n`;
          out += `   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n`;
          out += `   Default Gateway . . . . . . . . . : \n`;
        } else {
          out += `   Media State . . . . . . . . . . . : Media disconnected\n`;
        }
        out += `\n`;
      });
      return out;
    },
    systeminfo: (_, d) => `
Host Name:                 ${(d?.hostname || "WINDOWS-PC").toUpperCase()}
OS Name:                   Microsoft Windows Server 2022 Datacenter
OS Version:                10.0.20348 N/A Build 20348
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Server
System Type:               x64-based PC
Total Physical Memory:     4,096 MB`,
  },
};

export const ARUBA_CLI: CliTemplate = {
  welcome: `
ArubaOS-Switch
Copyright (C) 1991-2022 Hewlett Packard Enterprise Development LP
RESTRICTED RIGHTS LEGEND
`,
  prompt: "# ",
  commands: {
    help: () => `
Available commands:
  show vlans           - Show VLAN information
  show interfaces brief - Show interface summary
  show run             - Show running configuration
  config t             - Enter configuration terminal
  clear                - Clear screen`,
    "show vlans": () => `
 Status and Counters - VLAN Information
  Maximum VLANs to support : 256
  Primary VLAN : DEFAULT_VLAN
  Management VLAN :
 
  VLAN ID Name                 | Status     Voice Jumbo
  ------- -------------------- + ---------- ----- -----
  1       DEFAULT_VLAN         | Port-based No    No 
  10      LAN_ADMIN            | Port-based No    No 
`,
    "show interfaces brief": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "\nStatus and Counters - Port Status\n\n  Port    Type      | Alert   Enabled  Status      Mode        MDIX\n  ------- --------- + ------- -------- ----------- ----------- -------\n";
      ifaces.forEach((i: any) => {
        out += `  ${i.name.padEnd(7)} 1000T     | No      Yes      ${(i.status || "Up").padEnd(11)} 1000FDx     Auto\n`;
      });
      return out;
    },
    "show run": (_, d) => `
Running configuration:
 
; J9776A Configuration Editor; Created on release #YA.16.10.0019
; hostname : ${hostname(d)}
 
hostname "${hostname(d)}"
snmp-server community "public" unrestricted
vlan 1
   name "DEFAULT_VLAN"
   untagged 1-24
   ip address dhcp-bootp
   exit
`,
  },
};

export const INTELBRAS_CLI: CliTemplate = {
  welcome: `
===============================================================
Intelbras Datacom Switch - Sistema Operacional de Redes
Copyright (c) 2004-2023 Intelbras S/A. Todos os direitos reservados.
===============================================================
`,
  prompt: "> ",
  commands: {
    help: () => `
Comandos disponíveis:
  display interface brief - Exibe o status das interfaces
  display vlan            - Exibe a lista de VLANs
  display current-config  - Exibe a configuracao atual
  system-view             - Entra no modo de configuracao global
  clear                   - Limpa a tela`,
    "display interface brief": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "\nBrief information on interface(s) under route mode:\nLink: ADM - administratively down; Stby - standby\nProtocol: (s) - spoofing\nInterface            Link Protocol Main IP         Description\n";
      ifaces.forEach((i: any) => {
        out += `${i.name.padEnd(20)} UP   UP       ${(i.ip || "--").padEnd(15)} \n`;
      });
      return out;
    },
    "display vlan": () => `
 Total VLANs: 1
 The VLANs include:
 1(default)
`,
    "display current-config": (_, d) => `
#
 sysname ${hostname(d)}
#
vlan batch 1
#
`,
  },
};

export const JUNIPER_CLI: CliTemplate = {
  welcome: `
--- JUNOS 21.4R1.12 built 2022-01-14 20:01:03 UTC
`,
  prompt: "> ",
  commands: {
    "?": () => `
Possible completions:
  clear                Clear information in the system
  configure            Manipulate software configuration information
  show                 Show system information
  ping                 Ping remote target
  quit                 Exit the management session`,
    "show interfaces terse": (_, d) => {
      const ifaces = d?.interfaces || [];
      let out = "\nInterface               Admin Link Proto    Local                 Remote\n";
      ifaces.forEach((i: any) => {
        out += `${i.name.padEnd(23)} up    up\n`;
        if (i.ip) out += `                                inet     ${i.ip}\n`;
      });
      return out;
    },
    "show route": () => `
inet.0: 3 destinations, 3 routes (3 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

0.0.0.0/0          *[Static/5] 2w1d 10:15:33
                    > to 192.168.1.1 via ge-0/0/0.0
`,
  },
};

export const CLI_VENDORS: Record<string, CliTemplate> = {
  cisco: CISCO_CLI,
  mikrotik: MIKROTIK_CLI,
  pfsense: PFSENSE_CLI,
  opnsense: PFSENSE_CLI,
  linux: LINUX_CLI,
  windows: WINDOWS_CLI,
  aruba: ARUBA_CLI,
  intelbras: INTELBRAS_CLI,
  juniper: JUNIPER_CLI,
  generic: LINUX_CLI,
  ubiquiti: LINUX_CLI, // fallback
  fortigate: CISCO_CLI, // fallback
};

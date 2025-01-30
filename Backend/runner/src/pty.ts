import { spawn, IPty } from 'node-pty';
import path from 'path';

const isWindows = process.platform === 'win32'; // Check if the OS is Windows
const SHELL = isWindows ? 'powershell.exe' : 'bash'; // Use PowerShell for Windows, bash for Unix-based systems
const WORKSPACE_DIR = "/workspace"; // Define the restricted workspace directory

export class TerminalManager {
    private sessions: { [id: string]: { terminal: IPty; replId: string } } = {};

    constructor() {
        this.sessions = {};
    }

    createPty(id: string, replId: string, onData: (data: string, pid: number) => void): IPty {
        const term = spawn(SHELL, [], {
            cols: 100,
            name: 'xterm',
            cwd: WORKSPACE_DIR, // Restrict the terminal's working directory to `/workspace`
            env: {
                ...process.env,
                HOME: WORKSPACE_DIR, // Set HOME to /workspace for additional safety
            },
        });

        term.onData((data: string) => onData(data, term.pid));

        // Store the session
        this.sessions[id] = { terminal: term, replId };

        // Cleanup when terminal exits
        term.onExit(() => {
            delete this.sessions[id];
        });

        return term;
    }

    write(terminalId: string, data: string): void {
        const session = this.sessions[terminalId];
        if (session) {
            const sanitizedData = this.sanitizeCommand(data);
            session.terminal.write(sanitizedData);
        }
    }

    sanitizeCommand(data: string): string {
        // Prevent 'cd' outside /workspace
        if (/cd\s+\/(?!workspace)/.test(data)) {
            return `echo "Access Denied: You can only navigate inside /workspace"\n`;
        }

        // Restrict potentially dangerous commands
        const restrictedCommands = ["rm -rf", "shutdown", "reboot"];
        for (const cmd of restrictedCommands) {
            if (data.includes(cmd)) {
                return `echo "Command '${cmd}' is not allowed."\n`;
            }
        }

        return data;
    }


    clear(terminalId: string): void {
        // Kill the terminal session and remove it from sessions
        const session = this.sessions[terminalId];
        if (session) {
            session.terminal.kill();
            delete this.sessions[terminalId];
        }
    }
}


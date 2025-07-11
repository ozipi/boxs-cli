# Boxs CLI

CLI tool for recording and uploading pentesting operations to the Boxs platform.

## Installation

```bash
npm install -g @b0xs/cli
```

## Quick Start

1. **Login to your Boxs platform**:
   ```bash
   boxs login
   ```

2. **Start recording an operation**:
   ```bash
   boxs start "HTB - Lame Machine" --campaign "OSCP"
   # Perform your pentesting work normally
   boxs stop
   ```

3. **Upload existing logs**:
   ```bash
   boxs upload session.log --title "THM Blue Room"
   ```

## Commands

### Authentication
- `boxs login` - Login to Boxs platform
- `boxs logout` - Logout and clear credentials
- `boxs config` - View and manage configuration

### Recording Operations
- `boxs start <title>` - Start recording a new operation
- `boxs stop` - Stop current recording and upload
- `boxs upload <files...>` - Upload existing log files

### Management
- `boxs list` - List your operations
- `boxs status` - Show current recording status

## Supported File Formats

- **Asciinema recordings** (`.cast`) - Full timing data for interactive replay
- **Script command output** (`.script`) - Terminal recordings with partial timing
- **Raw terminal logs** (`.log`, `.txt`) - Plain text logs
- **Tool outputs** - nmap XML, gobuster, sqlmap results
- **Multiple files** - Combine related files into single operation

## Examples

### Live Recording
```bash
# Start recording
boxs start "Web Application Assessment" --campaign "Client-XYZ"

# Your normal pentesting workflow
nmap -sV target.com
gobuster dir -u http://target.com -w /usr/share/wordlists/common.txt
sqlmap -u "http://target.com/login.php" --forms

# Stop and auto-upload
boxs stop
```

### Upload Existing Logs
```bash
# Single file
boxs upload pentest-session.log --title "Internal Network Assessment"

# Multiple related files
boxs upload nmap.xml gobuster.txt privesc.log \
  --merge --title "Full Infrastructure Test"

# Batch import historical data
boxs import ./old-pentests/ --recursive
```

## Configuration

The CLI stores configuration in `~/.boxs-config.json`:

```json
{
  "apiUrl": "https://your-boxs-platform.com",
  "token": "...",
  "defaultCampaign": "OSCP"
}
```

## Development

```bash
git clone https://github.com/ozipi/boxs-cli.git
cd boxs-cli
npm install
npm run build
npm link  # For local testing
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [Boxs Platform](https://github.com/ozipi/boxs) - Web platform for operation analysis
- [Asciinema](https://asciinema.org/) - Terminal recording format we support
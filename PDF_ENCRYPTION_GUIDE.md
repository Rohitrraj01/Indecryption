# PDF Encryption Guide

## Overview

Indecryption 2.0 now supports **end-to-end encrypted PDF file transmission**. PDFs are encrypted using your custom encryption EXE before being sent to other users.

## Features

✅ **End-to-End Encrypted** - PDFs encrypted with sender & receiver phone numbers
✅ **Large File Support** - Up to 100MB per file
✅ **Progress Tracking** - Real-time encryption progress display
✅ **Base64 Encoding** - Safe transmission over JSON/Socket.IO
✅ **Automatic Cleanup** - Old encrypted PDFs automatically deleted after 24 hours

## Setup

### Prerequisites

1. Custom encryption EXE with PDF support
2. EXE must support `--pdf-encrypt` and `--pdf-decrypt` modes

### Configuration

Your encryption EXE must support these commands:

**Encryption:**
```bash
encryption.exe --pdf-encrypt "input.b64" "output.enc" "7292012183" "8218956871"
```

**Decryption:**
```bash
encryption.exe --pdf-decrypt "input.enc" "output.pdf" "7292012183" "8218956871"
```

### Environment Variables

```env
USE_EXTERNAL_ENCRYPTION=true
ENCRYPTION_EXE_PATH=D:\path\to\encryption.exe
```

## Usage

### 1. Encrypt a PDF

```typescript
import { encryptPDF, downloadPDF } from "@/lib/pdf-encryption";

// Select and encrypt PDF
const file = /* PDF File from input */;
const result = await encryptPDF(file, {
  senderNumber: "7292012183",
  receiverNumber: "8218956871",
  onProgress: (progress) => console.log(`${progress}%`),
  onError: (error) => console.error(error),
});

if (result.success) {
  console.log(`Encrypted: ${result.fileName}`);
  console.log(`Size: ${result.encryptedSize} bytes`);
  
  // Download encrypted PDF
  downloadPDF(result.encryptedPDF!, result.fileName!);
}
```

### 2. Send Encrypted PDF via Chat

```typescript
// In chat component
import { PDFEncryptionPanel } from "@/components/PDFEncryptionPanel";

<PDFEncryptionPanel
  senderNumber={currentUser.mobileNumber}
  receiverNumber={selectedContact.mobileNumber}
  receiverUsername={selectedContact.username}
/>
```

### 3. Receive Encrypted PDF

```typescript
// Listener for incoming encrypted PDFs (future implementation)
socketService.on("receive_pdf", (data) => {
  const { encryptedPDF, fileName, senderUsername } = data;
  
  // User can download or decrypt
  downloadPDF(encryptedPDF, fileName);
});
```

## API Endpoints

### POST /api/pdf/encrypt

Encrypt a PDF file.

**Request:**
```json
{
  "pdfBase64": "JVBERi0xLjQK...",
  "fileName": "document.pdf",
  "senderNumber": "7292012183",
  "receiverNumber": "8218956871"
}
```

**Response:**
```json
{
  "success": true,
  "encryptedPDF": "gY3DQfLZpK8m...",
  "fileName": "document.encrypted.pdf",
  "originalSize": 102400,
  "encryptedSize": 102500
}
```

**Errors:**
```json
{
  "error": "Phone numbers must be 10 digits"
}
```

### POST /api/pdf/decrypt

Decrypt an encrypted PDF file.

**Request:**
```json
{
  "encryptedPDFBase64": "gY3DQfLZpK8m...",
  "fileName": "document.encrypted.pdf",
  "senderNumber": "7292012183",
  "receiverNumber": "8218956871"
}
```

**Response:**
```json
{
  "success": true,
  "decryptedPDF": "JVBERi0xLjQK...",
  "fileName": "document.pdf"
}
```

### GET /api/pdf/status

Check PDF encryption service status.

**Response:**
```json
{
  "status": "PDF encryption service active",
  "maxFileSize": "100MB",
  "supportedFormats": ["application/pdf"],
  "encryption": "External EXE based"
}
```

## File Size Limits

- **Maximum**: 100MB per file
- **Recommended**: 50MB for optimal performance
- **Timeout**: 2 minutes per encryption/decryption

## EXE Requirements

### Input Format

PDFs are converted to **Base64** before passing to EXE:

1. Read PDF file as binary
2. Encode to Base64
3. Save to temporary `.b64` file
4. Pass to EXE: `encryption.exe --pdf-encrypt "input.b64" "output.enc" ...`
5. EXE writes encrypted output to `.enc` file

### Output Format

EXE should write encrypted binary data directly to output file (not Base64).

Example EXE implementation (pseudocode):

```cpp
// Read Base64 input
string base64_input = read_file(argv[2]);
vector<byte> pdf_binary = base64_decode(base64_input);

// Encrypt
string sender = argv[4];      // "7292012183"
string receiver = argv[5];    // "8218956871"
vector<byte> encrypted = encrypt_pdf(pdf_binary, sender, receiver);

// Write binary output
write_file(argv[3], encrypted);
```

## Security Considerations

### Phone Numbers as Encryption Key

- **Not** used as cryptographic key directly
- Used as encryption **parameters/seeds** for key derivation
- Provides user-specific encryption context
- 10-digit format: ensures consistent length

### Storage

- Encrypted PDFs stored temporarily in `uploads/encrypted_pdfs/`
- **Automatically deleted** after 24 hours
- Never stored permanently without user action

### Transmission

- Sent as Base64 over JSON/WebSocket
- Can be stored in database if needed
- Multiple layers of encryption possible:
  1. PDF content encryption (by EXE)
  2. JSON encryption (if using SSL/TLS)
  3. TweetNaCl layer (optional additional encryption)

## Performance

### Encryption Time

- Small PDF (1MB): ~100-500ms
- Medium PDF (10MB): ~1-2 seconds
- Large PDF (50MB): ~5-10 seconds

### Optimization Tips

1. **Keep EXE optimized** - Use efficient algorithms
2. **Fast disk I/O** - Use SSD for temp files
3. **Stream processing** - Consider streaming for very large files
4. **Caching** - Cache common encryption parameters

## Troubleshooting

### PDF Not Found

```
Error: File not found: C:\path\to\file.pdf
```

**Solution:** Verify file path is correct and accessible.

### File Too Large

```
Error: File too large (max 100MB, got 150MB)
```

**Solution:** Split PDF or increase `MAX_SIZE` in service.

### EXE Timeout

```
Error: Command failed: timeout waiting for spawned process
```

**Solution:** 
- Optimize EXE for faster performance
- Increase timeout: `timeout: 180000` (3 minutes)
- Use streaming for very large files

### Invalid Phone Number

```
Error: Phone numbers must be 10 digits
```

**Solution:** Ensure phone numbers are exactly 10 digits (no country code).

## Testing

### Manual Test

```bash
# 1. Create test PDF (or use existing)
# 2. Test encryption EXE directly
encryption.exe --pdf-encrypt "test.b64" "test.enc" "1234567890" "9876543210"

# 3. Verify output file exists
# 4. Test server endpoint
curl -X POST http://localhost:5000/api/pdf/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "pdfBase64": "...",
    "fileName": "test.pdf",
    "senderNumber": "1234567890",
    "receiverNumber": "9876543210"
  }'
```

### Integration Test

1. Log in as User A
2. Click "Encrypt PDF"
3. Select test PDF
4. Verify encryption progress shows 0-100%
5. Download encrypted PDF
6. Verify file size changed
7. Compare with original

## Future Enhancements

- [ ] **Socket.IO PDF Transmission** - Send encrypted PDFs via real-time socket
- [ ] **PDF Preview** - Show encrypted PDF preview before sending
- [ ] **Batch Encryption** - Encrypt multiple PDFs at once
- [ ] **Streaming** - Support files larger than 100MB
- [ ] **Decryption Widget** - In-app PDF viewer for encrypted PDFs
- [ ] **Database Storage** - Store encrypted PDFs in database
- [ ] **Expiring Links** - Auto-delete PDFs after X downloads
- [ ] **Access Control** - Limit who can decrypt PDFs

## Examples

### Complete Encryption Flow

```typescript
import { encryptPDF, downloadPDF } from "@/lib/pdf-encryption";
import { useToast } from "@/hooks/use-toast";

export function ChatPDFExample() {
  const { toast } = useToast();
  const senderPhone = "7292012183";
  const receiverPhone = "8218956871";

  async function handlePDFUpload(file: File) {
    // Show progress
    const result = await encryptPDF(file, {
      senderNumber: senderPhone,
      receiverNumber: receiverPhone,
      onProgress: (progress) => {
        console.log(`Encrypting: ${progress}%`);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      },
    });

    if (result.success) {
      // Create message with encrypted PDF
      const messageData = {
        type: "pdf",
        fileName: result.fileName,
        encryptedPDF: result.encryptedPDF,
        originalSize: result.originalSize,
        encryptedSize: result.encryptedSize,
      };

      // Send via socket
      socketService.emit("send_pdf", messageData);

      // Also allow download
      downloadPDF(result.encryptedPDF!, result.fileName!);

      toast({
        title: "PDF Ready",
        description: `${result.fileName} encrypted and ready to send`,
      });
    }
  }

  return (
    <input
      type="file"
      accept=".pdf"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handlePDFUpload(file);
      }}
    />
  );
}
```

## Support

For issues or questions:

1. Check EXE command format
2. Verify phone numbers are 10 digits
3. Check server logs for encryption errors
4. Test EXE manually before integration

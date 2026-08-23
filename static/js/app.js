/**
 * IDVault - Frontend Application Scripts
 * Features: QR Camera Scanner, Instant Print, Copy Token, Auto-dismiss alerts
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auto-dismiss flash alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            if (bsAlert) {
                bsAlert.close();
            }
        }, 5000);
    });

    // 2. Initialize Camera QR Scanner if scanner element exists
    const qrReaderElement = document.getElementById('qr-reader');
    if (qrReaderElement && typeof Html5QrcodeScanner !== 'undefined') {
        const onScanSuccess = (decodedText, decodedResult) => {
            console.log(`Scan matched: ${decodedText}`);
            // If the decoded text is a full URL, redirect directly
            if (decodedText.includes('/verify/')) {
                window.location.href = decodedText;
            } else {
                // Otherwise interpret as token and redirect to /verify/<token>
                window.location.href = `/verify/${encodeURIComponent(decodedText)}`;
            }
        };

        const onScanFailure = (error) => {
            // Quietly ignore frame scan misses
        };

        const html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true
            },
            /* verbose= */ false
        );
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }

    // 3. Copy Token to Clipboard helper
    window.copyToClipboard = function(text, elementId) {
        navigator.clipboard.writeText(text).then(() => {
            const el = document.getElementById(elementId);
            if (el) {
                const originalHTML = el.innerHTML;
                el.innerHTML = '<i class="bi bi-check2"></i> Copied!';
                setTimeout(() => {
                    el.innerHTML = originalHTML;
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    // 4. Print ID Card helper
    window.printIDCard = function() {
        window.print();
    };
});

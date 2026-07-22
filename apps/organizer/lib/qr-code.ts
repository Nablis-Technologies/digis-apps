import QRCode from "qrcode"

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
  } catch (error) {
    console.error("QR Code generation failed:", error)
    throw error
  }
}

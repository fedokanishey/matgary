// NOTE: This file is not used - using client-side direct Cloudinary upload instead
// To enable server-side uploads, move this to /api/upload/route.ts
// See ImageUpload component for the client-side implementation

export {};
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "Matgary";
    const uploadType = (formData.get("type") as string) || "image";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // Generate timestamp and signature for Cloudinary
    const timestamp = Math.round(Date.now() / 1000);
    
    // Build the string to sign
    const paramsToSign = {
      folder: `${folder}/${userId}`,
      timestamp: timestamp.toString(),
    };

    // Create signature
    const crypto = await import("crypto");
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
      .join("&");
    
    const signature = crypto
      .createHash("sha1")
      .update(sortedParams + CLOUDINARY_API_SECRET)
      .digest("hex");

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", dataUri);
    cloudinaryFormData.append("api_key", CLOUDINARY_API_KEY);
    cloudinaryFormData.append("timestamp", timestamp.toString());
    cloudinaryFormData.append("signature", signature);
    cloudinaryFormData.append("folder", `${folder}/${userId}`);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${uploadType}/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      console.error("Cloudinary upload error:", errorData);
      return NextResponse.json(
        { error: "Failed to upload to Cloudinary" },
        { status: 500 }
      );
    }

    const result = await cloudinaryResponse.json();

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: "No publicId provided" }, { status: 400 });
    }

    // Verify the image belongs to this user
    if (!publicId.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const crypto = await import("crypto");
    
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", CLOUDINARY_API_KEY!);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to delete from Cloudinary" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

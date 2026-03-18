import { NextRequest, NextResponse } from "next/server";
// import { S3Storage } from "coze-coding-dev-sdk";
// import { getSupabaseClient } from "@/storage/database/supabase-client";

// 素材上传
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = formData.get("projectId") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;
    const shotIndex = formData.get("shotIndex") as string | null;
    const category = formData.get("category") as string | null;
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "缺少必要参数：projectId 或 type" },
        { status: 400 }
      );
    }

    // const supabaseClient = getSupabaseClient();
    const materialData: Record<string, any> = {
      project_id: projectId,
      type,
      description,
      shot_index: shotIndex ? parseInt(shotIndex) : null,
      category: category,
    };

    if (file && (type === "image" || type === "video")) {
      // 注释掉 S3Storage 上传
      // const storage = new S3Storage({
      //   endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      //   accessKey: "",
      //   secretKey: "",
      //   bucketName: process.env.COZE_BUCKET_NAME,
      //   region: "cn-beijing",
      // });
      // const arrayBuffer = await file.arrayBuffer();
      // const buffer = Buffer.from(arrayBuffer);
      // const fileKey = await storage.uploadFile({
      //   fileContent: buffer,
      //   fileName: `materials/${projectId}/${Date.now()}_${file.name}`,
      //   contentType: file.type,
      // });
      // const accessUrl = await storage.generatePresignedUrl({
      //   key: fileKey,
      //   expireTime: 86400 * 30,
      // });
      // materialData.file_key = fileKey;
      // materialData.url = accessUrl;
      
      // 改为本地存储路径
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = `${Date.now()}_${file.name}`;
      const filepath = `/tmp/materials/${projectId}/${filename}`;
      
      // 保存到本地文件系统
      const { writeFileSync, mkdirSync, existsSync } = await import("fs");
      const { join, dirname } = await import("path");
      const dir = dirname(filepath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filepath, buffer);
      
      materialData.file_key = filepath;
      materialData.url = `/api/materials/file?path=${encodeURIComponent(filepath)}`;
      console.log("[Storage] 素材保存到本地:", filepath);
    } else if (url) {
      materialData.url = url;
    }

    // const { data, error } = await supabaseClient
    //   .from("materials")
    //   .insert(materialData)
    //   .select()
    //   .single();
    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 });
    // }
    // return NextResponse.json({ success: true, material: data });
    
    const mockMaterial = {
      id: "mock-mat-" + Date.now(),
      ...materialData,
      created_at: new Date().toISOString(),
    };
    console.log("[DB] 保存素材:", mockMaterial);
    return NextResponse.json({ success: true, material: mockMaterial });
  } catch (error) {
    console.error("素材上传失败:", error);
    return NextResponse.json({ error: "素材上传失败" }, { status: 500 });
  }
}

// 获取项目的素材列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "缺少参数：projectId" }, { status: 400 });
    }

    // const supabaseClient = getSupabaseClient();
    // const { data, error } = await supabaseClient
    //   .from("materials")
    //   .select("*")
    //   .eq("project_id", projectId)
    //   .order("created_at", { ascending: false });
    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 });
    // }
    // return NextResponse.json({ success: true, materials: data });
    console.log("[DB] 获取素材列表:", { projectId });
    return NextResponse.json({ success: true, materials: [] });
  } catch (error) {
    return NextResponse.json({ error: "获取素材列表失败" }, { status: 500 });
  }
}

// 删除素材
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("id");

    if (!materialId) {
      return NextResponse.json({ error: "缺少参数：id" }, { status: 400 });
    }

    // const supabaseClient = getSupabaseClient();
    // const { data: material } = await supabaseClient
    //   .from("materials")
    //   .select("file_key")
    //   .eq("id", materialId)
    //   .single();
    // if (material?.file_key) {
    //   const storage = new S3Storage({
    //     endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    //     accessKey: "",
    //     secretKey: "",
    //     bucketName: process.env.COZE_BUCKET_NAME,
    //     region: "cn-beijing",
    //   });
    //   await storage.deleteFile({ fileKey: material.file_key });
    // }
    // const { error } = await supabaseClient
    //   .from("materials")
    //   .delete()
    //   .eq("id", materialId);
    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 });
    // }
    // return NextResponse.json({ success: true });
    console.log("[DB] 删除素材:", { materialId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "删除素材失败" }, { status: 500 });
  }
}

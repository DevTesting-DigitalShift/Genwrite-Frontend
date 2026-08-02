import adminAxiosInstance from "@admin/auth/adminAxiosInstance"

export async function exportAdminData(type: "revenue" | "users" | "jobs"): Promise<Blob> {
  const response = await adminAxiosInstance.get("/admin/export", {
    params: { type },
    responseType: "blob",
  })
  return response.data
}

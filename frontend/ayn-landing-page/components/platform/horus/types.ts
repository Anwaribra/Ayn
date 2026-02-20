export interface AttachedFile {
    id: string
    file: File
    preview?: string
    type: "image" | "document"
}

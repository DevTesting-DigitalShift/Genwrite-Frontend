import React from "react"
import EditorWrapper from "./EditorWrapper"
import dummyData from "./dummyData.json"

export default function TestEditor() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <EditorWrapper data={dummyData.contentJSON} userPlan="premium" />
    </div>
  )
}

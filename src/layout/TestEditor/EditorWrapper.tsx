import React from "react"
import SectionList from "./SectionList"
import { EditorDocument, UserPlan } from "./EditorTypes"

interface Props {
  data: EditorDocument
  userPlan: UserPlan
}

const EditorWrapper: React.FC<Props> = ({ data, userPlan }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <SectionList contentJSON={data} userPlan={userPlan} />
    </div>
  )
}

export default EditorWrapper

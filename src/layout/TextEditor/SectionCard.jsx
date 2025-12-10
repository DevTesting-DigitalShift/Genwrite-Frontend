import React, { useState } from "react"
import { motion } from "framer-motion"
import { RotateCcw, Trash2, Lock, Edit3 } from "lucide-react"
import { Tooltip, Input } from "antd"
import SectionEditor from "./SectionEditor"

const SectionCard = ({
  section,
  index,
  isEditing,
  locked,
  onReveal,
  onDelete,
  onRegenerate,
  onContentChange,
  onTitleChange,
  onStartEditing,
  onStopEditing,
  onNavigateToPricing,
}) => {
  const [editingTitle, setEditingTitle] = useState(false)

  return (
    <motion.div
      key={section.id || index}
      className="relative border rounded-xl p-5 shadow-sm bg-white mb-6 hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Locked overlay */}
      {locked && !section.revealed && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 font-medium">Upgrade to unlock</p>
            <button
              onClick={e => {
                e.stopPropagation()
                onNavigateToPricing()
              }}
              className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-2 z-20">
        {section.revealed && (
          <Tooltip title="Regenerate Section">
            <button
              onClick={e => {
                e.stopPropagation()
                onRegenerate()
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-gray-500" />
            </button>
          </Tooltip>
        )}
        <Tooltip title="Delete Section">
          <button
            onClick={e => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </Tooltip>
      </div>

      {/* Section title - editable */}
      <div className="mb-3 pr-20">
        {editingTitle ? (
          <Input
            value={section.title}
            onChange={e => onTitleChange(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onPressEnter={() => setEditingTitle(false)}
            autoFocus
            className="text-xl font-bold"
          />
        ) : (
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={e => {
              e.stopPropagation()
              if (section.revealed) setEditingTitle(true)
            }}
          >
            <h2 className="text-xl font-bold">{section.title}</h2>
            {section.revealed && (
              <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        )}
      </div>

      {/* Keywords */}
      {section.keywords && section.keywords.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {section.keywords.map((kw, i) => (
            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* Content area */}
      {!section.revealed ? (
        <div
          className="cursor-pointer"
          onClick={() => {
            if (!locked) onReveal()
          }}
        >
          <div className="blur-sm pointer-events-none select-none">
            <div
              className="prose max-w-none blog-content"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
          {!locked && (
            <div className="mt-4 text-center">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Click to Reveal
              </button>
            </div>
          )}
        </div>
      ) : isEditing ? (
        <div className="mt-3" onClick={e => e.stopPropagation()}>
          <SectionEditor
            initialContent={section.content}
            onChange={html => onContentChange({ content: html })}
            onBlur={onStopEditing}
          />
        </div>
      ) : (
        <div className="cursor-pointer group" onClick={onStartEditing}>
          <div
            className="prose max-w-none blog-content"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
          <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm text-gray-500">Click to edit</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default SectionCard

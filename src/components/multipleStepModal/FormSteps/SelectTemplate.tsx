import TemplateSelection, { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import { selectUser } from "@store/slices/authSlice"
import { Form, FormInstance, Typography } from "antd"
import { useCallback, FC } from "react"
import { useSelector } from "react-redux"

const { Text } = Typography

interface SelectTemplateProps {
  form: FormInstance<any>
  numberOfTemplates?: number
}

const SelectTemplate: FC<SelectTemplateProps> = ({ form, numberOfTemplates = 1 }) => {
  const user = useSelector(selectUser)

  const errors = form.getFieldError("selectedTemplates")
  const validateStatus = errors.length > 0 ? "error" : ""
  // Dynamic message based on validation status
  const messageText =
    validateStatus === "error"
      ? errors.join(", ")
      : `You can choose up to ${numberOfTemplates} template${numberOfTemplates > 1 ? "s" : ""}`

  const handleTemplates = useCallback(
    (selectedTemplates: BlogTemplate[]) => {
      form.setFieldsValue({ selectedTemplates })
    },
    [form]
  )

  return (
    <>
      {/* Display dynamic message or error */}
      <Text
        style={{
          display: "block",
          marginBottom: 8,
          color: validateStatus === "error" ? "#ff4d4f" : "#595959",
        }}
      >
        {messageText}
      </Text>
      <Form.Item
        name="selectedTemplates"
        rules={[
          {
            required: true,
            message: "Please select at least one template.",
            validator: (_, value) =>
              value && value.length > 0
                ? Promise.resolve()
                : Promise.reject(new Error("Please select at least one template.")),
          },
        ]}
      >
        <TemplateSelection
          numberOfSelection={numberOfTemplates} // Example: Allow up to 2 templates
          userSubscriptionPlan={user?.subscription?.plan || "free"}
          onClick={handleTemplates}
          preSelectedIds={
            form.getFieldValue("selectedTemplates")?.map((pkg: BlogTemplate) => pkg.id) || []
          }
        />
      </Form.Item>
    </>
  )
}

export default SelectTemplate

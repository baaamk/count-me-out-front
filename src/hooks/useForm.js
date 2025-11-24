import { useState } from "react";

/**
 * 폼 관리 커스텀 훅
 * @param {Object} initialValues - 초기 값 객체
 * @param {Object} validators - 검증 함수 객체
 * @returns {Object} 폼 상태 및 핸들러
 */
export function useForm(initialValues = {}, validators = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 실시간 검증
    if (touched[name] && validators[name]) {
      const error = validators[name](value);
      setErrors((prev) => ({
        ...prev,
        [name]: error || null,
      }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // 검증
    if (validators[name]) {
      const error = validators[name](values[name]);
      setErrors((prev) => ({
        ...prev,
        [name]: error || null,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validators).forEach((name) => {
      const error = validators[name](values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues,
  };
}


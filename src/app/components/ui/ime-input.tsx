import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
} from "react";

// 한글(IME) 조합 중 controlled value 재설정으로 글자가 끊기는 문제(특히 Windows Chromium: Edge/Chrome)를
// 막는 입력 래퍼. 조합 중에는 내부 표시값만 갱신하고 부모 onChange/리렌더 반영을 보류, compositionEnd에
// 한 번에 커밋한다. macOS IME는 조합 중 리렌더에 강건해 native input으로도 정상이지만 Windows는 취약.

type IMEInputProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function IMEInput({ value, onChange, ...rest }: IMEInputProps) {
  const [inner, setInner] = useState(value);
  const composing = useRef(false);

  // 조합 중이 아닐 때만 외부 value를 표시값에 동기화(조합 중 동기화 시 끊김).
  useEffect(() => {
    if (!composing.current) setInner(value);
  }, [value]);

  return (
    <input
      {...rest}
      value={inner}
      onChange={event => {
        setInner(event.target.value);
        if (!composing.current) onChange(event);
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={event => {
        composing.current = false;
        onChange(event as unknown as ChangeEvent<HTMLInputElement>);
      }}
    />
  );
}

type IMETextareaProps = Omit<ComponentPropsWithoutRef<"textarea">, "value" | "onChange"> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export function IMETextarea({ value, onChange, ...rest }: IMETextareaProps) {
  const [inner, setInner] = useState(value);
  const composing = useRef(false);

  useEffect(() => {
    if (!composing.current) setInner(value);
  }, [value]);

  return (
    <textarea
      {...rest}
      value={inner}
      onChange={event => {
        setInner(event.target.value);
        if (!composing.current) onChange(event);
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={event => {
        composing.current = false;
        onChange(event as unknown as ChangeEvent<HTMLTextAreaElement>);
      }}
    />
  );
}

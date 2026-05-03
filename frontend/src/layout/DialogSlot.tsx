import { RefObject } from "react";
import { CommandBus } from "../core/CommandBus";
import { DialogInput } from "../components/Dialog/DialogInput";

type DialogSlotProps = {
  bus: CommandBus;
  inputRef: RefObject<HTMLInputElement>;
};

export function DialogSlot({ bus, inputRef }: DialogSlotProps) {
  return (
    <section className="dialog-slot" aria-label="JARVIS command dialog">
      <DialogInput bus={bus} inputRef={inputRef} />
    </section>
  );
}

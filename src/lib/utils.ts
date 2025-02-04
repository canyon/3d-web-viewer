import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getByteKBMBMsg (bytes: number) {
  const fileSizeInBytes = bytes;
  const fileSizeInKB = Math.round(fileSizeInBytes / 1024);
  const fileSizeInMB = fileSizeInBytes / 1024 / 1024;
  const fileSizeInMBDisplay =
    fileSizeInMB < 1 ? "<1" : Math.round(fileSizeInMB);
  const msg = `File Size: ${fileSizeInBytes} bytes (${fileSizeInKB} KB, ${fileSizeInMBDisplay} MB)`;
  return msg;
}
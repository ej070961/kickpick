type ZipFile = {
  name: string;
  data: Blob;
};

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function write32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

/** PNG는 이미 압축된 형식이므로 ZIP 안에 그대로 담습니다. */
export async function createZipBlob(files: ZipFile[]) {
  const encoder = new TextEncoder();
  const localParts: BlobPart[] = [];
  const centralParts: BlobPart[] = [];
  let localOffset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = new Uint8Array(await file.data.arrayBuffer());
    const checksum = crc32(data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);

    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write16(localView, 6, 0x0800);
    write16(localView, 8, 0);
    write32(localView, 14, checksum);
    write32(localView, 18, data.length);
    write32(localView, 22, data.length);
    write16(localView, 26, name.length);
    localHeader.set(name, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);

    write32(centralView, 0, 0x02014b50);
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800);
    write16(centralView, 10, 0);
    write32(centralView, 16, checksum);
    write32(centralView, 20, data.length);
    write32(centralView, 24, data.length);
    write16(centralView, 28, name.length);
    write32(centralView, 42, localOffset);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);

    localOffset += localHeader.length + data.length;
  }

  const centralDirectory = new Blob(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  write32(endView, 0, 0x06054b50);
  write16(endView, 8, files.length);
  write16(endView, 10, files.length);
  write32(endView, 12, centralDirectory.size);
  write32(endView, 16, localOffset);

  return new Blob([...localParts, centralDirectory, endRecord], {
    type: "application/zip",
  });
}

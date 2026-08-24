Payload decode instructions for xzyqrn/qr-art:

main.ts: base64 -d _payload/main.ts.deflate.b64 | python3 -c "import sys,zlib; sys.stdout.buffer.write(zlib.decompress(sys.stdin.buffer.read()))" > src/main.ts

package-lock.json: base64 -d _payload/package-lock.json.deflate.b64 | python3 -c "import sys,zlib; sys.stdout.buffer.write(zlib.decompress(sys.stdin.buffer.read()))" > package-lock.json

Expected sizes after decode: main.ts 30506 chars, package-lock.json 48983 chars.

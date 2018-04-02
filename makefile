
# Compress to zip for chrome store.
build: clean
	zip -r package.zip src -x */.DS_Store -x \*test\*

clean:
	rm -f package.zip
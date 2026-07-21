package main

import (
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const runtimeVersion = "0.3.0-r4"

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "Teach launcher:", err)
		var exitError *exec.ExitError
		if errors.As(err, &exitError) {
			os.Exit(exitError.ExitCode())
		}
		os.Exit(1)
	}
}

func run() error {
	if runtime.GOOS != "windows" || runtime.GOARCH != "amd64" {
		return fmt.Errorf("unsupported Windows architecture %s/%s", runtime.GOOS, runtime.GOARCH)
	}
	executable, err := os.Executable()
	if err != nil {
		return err
	}
	archive := filepath.Join(filepath.Dir(executable), "teach-mcp-windows-x64.gz")
	cache, err := os.UserCacheDir()
	if err != nil {
		return err
	}
	runtimeDir := filepath.Join(cache, "Teach", "runtime")
	runtimePath := filepath.Join(runtimeDir, "teach-mcp-"+runtimeVersion+".exe")
	if _, err := os.Stat(runtimePath); errors.Is(err, os.ErrNotExist) {
		if err := unpack(archive, runtimePath); err != nil {
			return err
		}
	}
	command := exec.Command(runtimePath, os.Args[1:]...)
	command.Stdin = os.Stdin
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	command.Env = os.Environ()
	return command.Run()
}

func unpack(archivePath, runtimePath string) error {
	if err := os.MkdirAll(filepath.Dir(runtimePath), 0700); err != nil {
		return err
	}
	archive, err := os.Open(archivePath)
	if err != nil {
		return err
	}
	defer archive.Close()
	compressed, err := gzip.NewReader(archive)
	if err != nil {
		return err
	}
	defer compressed.Close()
	temporary, err := os.CreateTemp(filepath.Dir(runtimePath), "teach-runtime-*.tmp")
	if err != nil {
		return err
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	if err := temporary.Chmod(0700); err != nil {
		temporary.Close()
		return err
	}
	if _, err := io.Copy(temporary, compressed); err != nil {
		temporary.Close()
		return err
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	if err := os.Rename(temporaryPath, runtimePath); err != nil {
		if _, statErr := os.Stat(runtimePath); statErr == nil {
			return nil
		}
		return err
	}
	return nil
}

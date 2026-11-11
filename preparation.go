package main

import (
	"fmt"

	"dataTrading/utils"
)

func Preparation() error {

	err := utils.EncryptFileWithMasterKey(
		webInFile,
		webOutFile,
		webOutKey,
		webMasterK1,
	)

	if err != nil {
		return fmt.Errorf("第一阶段加密失败: %w", err)
	}

	k1Map, err := utils.ScanDir(webOutKey)
	if err != nil {
		return fmt.Errorf("扫描 Key 文件失败: %w", err)
	}

	utils.EncryptFileWithMasterKey2(
		k1Map,
		webOutKey,
		webOutEncKey,
		webKey2sDir,
		webMasterK2,
	)

	webSampleTree = utils.CommitSampleKeys(
		webKey2sDir,
		webChallengeLength,
	)

	if webSampleTree == nil {
		return fmt.Errorf("生成 Merkle Tree 失败")
	}

	webSampleTree.PrintTree()

	return nil
}

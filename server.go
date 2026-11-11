package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	webDatasetName = ""
webDatasetSize = 0
webDatasetCount = 0
    r := gin.Default()

    // CORS：必须放在所有业务路由注册之前
    r.Use(func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")

        if origin == "http://localhost:5173" ||
            origin == "http://localhost:5174" {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
            c.Writer.Header().Set("Vary", "Origin")
        }

        c.Writer.Header().Set(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS",
        )
        c.Writer.Header().Set(
            "Access-Control-Allow-Headers",
            "Content-Type",
        )

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    })

    // 数据集上传路由
    r.POST("/api/upload-dataset", UploadDataset)
    r.GET("/api/dataset-info", GetDatasetInfo)

	// ==================================================
	// 查询真实智能合约 State
	// ==================================================

	r.GET("/api/trade-status", func(c *gin.Context) {
		state, err := GetTradeStatus()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"state":   state,
		})
	})

	// ==================================================
	// Seller STEP 01
	// Preparation
	// ==================================================

	r.POST("/api/preparation", func(c *gin.Context) {
		err := Preparation()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Preparation 执行成功",
		})
	})

	// ==================================================
	// Seller STEP 02
	// Commit Data
	// ==================================================

	r.POST("/api/commit-data", func(c *gin.Context) {
		err := CommitData()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Commit Data 执行成功",
		})
	})

	// ==================================================
	// Buyer STEP 02
	//
	// PreChallenge + Challenge
	// ==================================================

	r.POST("/api/challenge", func(c *gin.Context) {
		txHash, err := WebChallenge()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Challenge 执行成功",
			"txHash":  txHash,
		})
	})

	// ==================================================
	// Seller STEP 03
	// Response
	// ==================================================

	r.POST("/api/response", func(c *gin.Context) {
		txHash, err := WebResponse()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Response 执行成功",
			"txHash":  txHash,
		})
	})

	// ==================================================
	// Buyer STEP 03
	// Check Sample
	// ==================================================

	r.POST("/api/check-sample", func(c *gin.Context) {
		err := WebCheckSample()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Sample 验证成功",
			"images": []string{
				"/demo/car_01.jpg",
				"/demo/car_02.jpg",
				"/demo/car_03.jpg",
				"/demo/car_04.jpg",
				"/demo/car_05.jpg",
			},
		})
	})

	// ==================================================
	// Buyer STEP 04
	// Payleft
	// ==================================================

	r.POST("/api/payleft", func(c *gin.Context) {
		txHash, err := WebPayleft()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Payleft 执行成功",
			"txHash":  txHash,
		})
	})

	// ==================================================
	// Seller
	// Release Master Key
	// ==================================================

	r.POST("/api/release-masterkey", func(c *gin.Context) {
		txHash, err := WebReleaseMasterkey()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "主密钥释放成功",
			"txHash":  txHash,
		})
	})

	r.Run(":8080")
}

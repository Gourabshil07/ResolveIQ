package com.resolveiq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CommentRequest {

    @NotBlank(message = "Comment text cannot be empty")
    @Size(min = 2, max = 2000, message = "Comment must be between 2 and 2000 characters")
    private String commentText;

    public CommentRequest() {
    }

    public CommentRequest(String commentText) {
        this.commentText = commentText;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }
}

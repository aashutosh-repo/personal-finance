import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatbotService } from '../../service/tansaction/chatbot.service';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChatMessage, ChatRequest } from '../../../model/chatbot.model';
import { isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-chatbot',
  imports: [SharedMaterialModules],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {
  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  isLoading = false;
  conversationId: string | undefined;

  // Initial system message for chatbot
  systemMessage: ChatMessage = {
    role: 'assistant',
    content: 'Hi! I\'m your personal financial advisor. I can help you with insights about your spending, budgeting tips, investment advice, and more. How can I assist you today?',
    timestamp: new Date().toISOString()
  };

  constructor(
    private fb: FormBuilder,
    private chatbotService: ChatbotService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize with system message
      this.messages.push(this.systemMessage);
    }
  }

  sendMessage() {
    if (this.chatForm.valid && !this.isLoading) {
      const userInput = this.chatForm.value.message.trim();
      
      if (!userInput) {
        return;
      }

      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        content: userInput,
        timestamp: new Date().toISOString()
      };
      this.messages.push(userMessage);
      this.chatForm.reset();

      // Show loading indicator
      this.isLoading = true;

      // Prepare request
      const chatRequest: ChatRequest = {
        message: userInput,
        conversationId: this.conversationId
      };

      // Send to chatbot
      this.chatbotService.sendMessage(chatRequest).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Add assistant response
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: response.data.response,
              timestamp: new Date().toISOString()
            };
            this.messages.push(assistantMessage);

            // Update conversation ID if provided
            if (response.data.conversationId) {
              this.conversationId = response.data.conversationId;
            }
          } else {
            this.snackBar.open('Failed to get response from chatbot', 'Close', { duration: 4000 });
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          const errorMsg = err.error?.message || 'Failed to send message. Please try again.';
          this.snackBar.open(errorMsg, 'Close', { duration: 4000 });

          // Add error message to chat
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `Sorry, I couldn't process your request. Error: ${errorMsg}`,
            timestamp: new Date().toISOString()
          };
          this.messages.push(errorMessage);
        }
      });
    }
  }

  clearChat() {
    this.messages = [this.systemMessage];
    this.conversationId = undefined;
    this.snackBar.open('Chat cleared', 'OK', { duration: 2000 });
  }

  // Track by function for performance
  trackByTimestamp(index: number, item: ChatMessage) {
    return item.timestamp;
  }
}

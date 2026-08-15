import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { SharedMaterialModules } from '../../../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatbotService } from '../../../../service/tansaction/chatbot.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChatMessage, ChatRequest } from '../../../../../model/chatbot.model';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

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
  isDarkTheme = false;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // Initial system message for chatbot
  systemMessage: ChatMessage = {
    role: 'assistant',
    userId: "system",
    content: 'Hi! I\'m your personal financial advisor. I can help you with insights about your spending, budgeting tips, investment advice, and more. How can I assist you today?',
    timestamp: new Date().toISOString()
  };

  constructor(
    private fb: FormBuilder,
    private chatbotService: ChatbotService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
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
      // load persisted theme preference or respect OS preference
      try {
        const stored = localStorage.getItem('chatbot-dark');
        if (stored !== null) {
          this.isDarkTheme = stored === 'true';
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.isDarkTheme = true;
        }
      } catch (e) {
        // ignore storage errors
      }
      // scroll initial message into view
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  /**
   * Format message content to support code blocks, quotes, and bold text
   * Converts markdown-like syntax to HTML
   */
  formatMessageContent(content: string): SafeHtml {
    let formatted = content || '';

    // 1. First, handle code blocks (triple backticks) BEFORE escaping HTML
    // This preserves code content as-is
    const codeBlockRegex = /```([\w]*)\n?([\s\S]*?)\n?```/g;
    let codeBlockIndex = 0;
    const codeBlocks: { [key: string]: string } = {};

    formatted = formatted.replace(codeBlockRegex, (match, language, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
      // Escape HTML inside code blocks
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();
      codeBlocks[placeholder] = `<pre class="code-block"><code class="language-${language}">${escapedCode}</code></pre>`;
      codeBlockIndex++;
      return placeholder;
    });

    // 2. Escape HTML special characters (except placeholders)
    formatted = formatted
      .replace(/&(?!amp;|lt;|gt;|#|\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 3. Restore code blocks
    Object.keys(codeBlocks).forEach(placeholder => {
      formatted = formatted.replace(placeholder, codeBlocks[placeholder]);
    });

    // 4. Convert inline code (single backticks)
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>'
    );

    // 5. Convert bold text (**text** or __text__)
    formatted = formatted.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong>$1</strong>'
    );
    formatted = formatted.replace(
      /__([^_]{1,}?)__/g,
      '<strong>$1</strong>'
    );

    // 6. Convert italic text (*text* or _text_)
    formatted = formatted.replace(
      /\*([^*]+)\*/g,
      '<em>$1</em>'
    );
    formatted = formatted.replace(
      /_([^_]+)_/g,
      '<em>$1</em>'
    );

    // 7. Convert blockquotes (lines starting with >)
    formatted = formatted.replace(
      /^&gt;\s+(.+)$/gm,
      '<blockquote class="message-quote">$1</blockquote>'
    );

    // 8. Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');

    // Sanitize with DOMPurify before trusting — safer than manual escaping alone
    try {
      const clean = DOMPurify.sanitize(formatted, { WHOLE_DOCUMENT: false }) as string;
      return this.sanitizer.bypassSecurityTrustHtml(clean);
    } catch (e) {
      return this.sanitizer.bypassSecurityTrustHtml(formatted);
    }
  }

  sendMessage() {
    if (this.chatForm.valid && !this.isLoading) {
      const userInput = this.chatForm.value.message.trim();
      console.log('User input:', userInput);
      const userId = this.authService.getCurrentUserID();

      if (!userInput || !userId) {
        return;
      }

      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        userId:  userId,
        content: userInput,
        timestamp: new Date().toISOString()
      };
      this.messages.push(userMessage);
      // scroll after adding user message
      setTimeout(() => this.scrollToBottom(), 50);
      this.chatForm.reset();

      // Show loading indicator
      this.isLoading = true;

      // Prepare request
      const chatRequest: ChatRequest = {
        userId: userId,
        message: userInput,
        conversationId: this.conversationId
      };

      console.log('📨 Sending message to chatbot:', chatRequest);

      // Send to chatbot
      this.chatbotService.sendMessage(chatRequest).subscribe({
        next: (response) => {
          console.log('✓ Response from chatbot:', response);
          
          if (response.success && response.data) {
            console.log('✓ Valid response received, adding to chat');
            const userId = this.authService.getCurrentUserID();
            if(!userId){
              console.log("No user Found");
              return;
            }
            // Add assistant response
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              userId: userId,
              content: response.data.response,
              timestamp: new Date().toISOString()
            };
            this.messages.push(assistantMessage);
            // scroll to reveal assistant response
            setTimeout(() => this.scrollToBottom(), 50);

            // Update conversation ID if provided
            if (response.data.conversationId) {
              this.conversationId = response.data.conversationId;
            }
          } else {
            console.warn('⚠️ Invalid response format:', response);
            this.snackBar.open('Failed to get response from chatbot', 'Close', { duration: 4000 });
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('✗ Error from chatbot service:', err);
          const errorMsg = err.error?.message || err.statusText || 'Failed to send message. Please try again.';
          this.snackBar.open(errorMsg, 'Close', { duration: 4000 });

          // Add error message to chat
          const errorMessage: ChatMessage = {
            role: 'assistant',
            userId: userId,
            content: `Sorry, I couldn't process your request. Error: ${errorMsg}`,
            timestamp: new Date().toISOString()
          };
          this.messages.push(errorMessage);
          setTimeout(() => this.scrollToBottom(), 50);
        }
      });
    }
  }

  clearChat() {
    this.messages = [this.systemMessage];
    this.conversationId = undefined;
    this.snackBar.open('Chat cleared', 'OK', { duration: 2000 });
    setTimeout(() => this.scrollToBottom(), 50);
  }

  // Track by function for performance
  trackByTimestamp(index: number, item: ChatMessage) {
    return item.timestamp;
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    try { localStorage.setItem('chatbot-dark', String(this.isDarkTheme)); } catch {}
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      // fallback
      try { this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; } catch {}
    }
  }
}

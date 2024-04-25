import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import {
  ChatSession,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import { environment } from '../environments/environment.development';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { FormsModule } from '@angular/forms';

import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, NgxSkeletonLoaderModule, MatChipsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'google-ai-gemini-angular';

  geminiProChat: any;
  geminiVisionProChat: any;

  prompt: string = '';
  promptImage: any;

  waitingResponse:boolean = false;

  chatHistory: { role: 'model' | 'user', text: string, image?: any }[] = [];

  constructor(
    public http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.geminiProChat = this.getGeminiProChat();
    this.geminiVisionProChat = this.getGeminiVisionProChat();
  }


  getGeminiProChat(): ChatSession {
    // Gemini Client
    const genAI = new GoogleGenerativeAI(environment.API_KEY);
    const generationConfig = {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      maxOutputTokens: 1000,
    };
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      ...generationConfig,
    });

    return model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 10000,
      },
    });
  }

  getGeminiVisionProChat(): ChatSession {
    const genAI = new GoogleGenerativeAI(environment.API_KEY);
    const generationConfig = {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      maxOutputTokens: 1000,
    };
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro-vision',
      ...generationConfig,
    });

    return model.startChat({
      generationConfig: {
        maxOutputTokens: 10000,
      },
    });
  }

  createNewChat(): void {
    this.geminiProChat = this.getGeminiProChat();
    this.geminiVisionProChat = this.getGeminiVisionProChat();
    this.chatHistory = [];
  }

  async sendPrompt(prompt: string) {

    try {

      this.prompt = prompt;
      let superClass = this;
      setTimeout(function () {
        superClass.scrollToPromptWaiting();
      }, 100);

      let result;

      this.waitingResponse = true;

      if (this.promptImage) {

        // let promptImageBase64 = await this.fileConversionService.convertToBase64(this.promptImage);
        let promptImageBase64 = this.promptImage.substring(this.promptImage.indexOf(',') + 1)
        // Check for successful conversion to Base64
        if (typeof promptImageBase64 !== 'string') {
          console.error('Image conversion to Base64 failed.');
          return;
        }

        let promptWithImage = [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: promptImageBase64,
            },
          },
          {
            text: this.prompt,
          },
        ];

        result = await this.geminiVisionProChat.sendMessage(promptWithImage);
      }
      else {
        result = await this.geminiProChat.sendMessage(this.prompt);
      }

      const response = await result.response;
      this.chatHistory.push({ role: 'user', text: this.prompt });
      this.chatHistory.push({ role: 'model', text: response.candidates?.[0].content.parts[0].text, image: this.promptImage });

      this.prompt = '';
      this.promptImage = null;

      this.waitingResponse = false;

    } catch (error) {
      console.error('Error converting file to Base64', error);
    }

  }

  private scrollToPromptWaiting() {
    const element = document.getElementById('prompt');
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  selectPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg';

    input.onchange = (event: any) => {
      const file: File = event.target.files[0];
      if (file) {
        this.readFile(file);
      }
    };

    input.click();

  }

  private readFile(file: File) {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      this.promptImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  deleteImage() {
    this.promptImage = null;
  }
}







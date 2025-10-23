
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ScannedItem, ExcelRow } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import FileUpload from './components/FileUpload';
import Scanner from './components/Scanner';
import ScannedItemsTable from './components/ScannedItemsTable';
import Toast from './components/Toast';
import { ExportIcon, SoundOnIcon, SoundOffIcon, SearchIcon } from './components/Icons';
import Statistics from './components/Statistics';

// Declare XLSX and ZXing as global variables from CDN scripts
declare var XLSX: any;
declare var ZXing: any;

// Base64 encoded audio files for offline use
const successSound = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjQwLjEwMQAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAElzZTY5AAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAElzZTY5AAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAElzZTY5AAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAElzZTY5AAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAElzZTY5AAAAAExhdmM1Ni42MAAAAAAAAAAAAAAAdTEFNRQAAAA//uQwgABpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwgARpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwgCRpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwgURpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwgYRpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwgghpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwgwhpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwg0hpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA//uQwg4hpBwh4EUoK/gP/7YsEwAABIyLvoBAAB1NjAQAAADAEAwQgAAYpEBAAAA';
const errorSound = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjQwLjEwMQAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAA/9sYAAAAAExhdmM1Ni42MAAAAAAAAAAAAAAA/9sYAMAAAGkAAAAAAAAAdTEFNRQAAAA//uQwgANamg4EYBoExB4A//tAwBwAGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwE4AGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwM4AGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwT4AGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwW4AGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwdoAGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwjYAGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwmYAGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwpoAGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwrIAGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//tAwuIAGkAAAAXQUxCTQAAABwAAAFsYXJnZSBidXp6ZXIgbG93IGFsdGVybmF0aW5n//uQxAYsA0sAwAAAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxAYEA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxAdoA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxAfIA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxAggA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxCigA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxC1AA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxDDgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxDRgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxDYAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxDfgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxDkQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxDtAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxD0gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxD6AA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxEBgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxEIwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxEQUA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxEewA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxEmgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxEvAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxE6gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxFCAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxFLgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxFWAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxFigA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxFvgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxF/gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxGEQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxGOgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxGdAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxGqAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxG3gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxHCwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxHPQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxHfQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxHqQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxH4gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxIEAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxISQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxIagA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxIvAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxI/gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxJFAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxJVAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxJigA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxJwgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxKEAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxKRgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxKYAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxKiAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxK0QA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxLAAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxLEwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxLRgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxLcgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxLqAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxMAAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxMDQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxMRwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxMdAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxMrwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxM+gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxNAgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxNKAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxNTAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxNdQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxNsAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxN9gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxOAgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxOKwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxOXAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxOnAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxO1wA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxPAQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxPLQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxPWAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxPogA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxPvwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxQAQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxQOAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxQcQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxQpQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxQ4QA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxRAQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxRKwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxRUAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxRggA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxRswA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxR/wA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxSAQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxSOwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxSbgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxSrAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxS7wA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxTAwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxTMgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxTZwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxToQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxT9gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxUCAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxUJQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxUbwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxUtAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxU9AA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxVAAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxVJQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxVWwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxVoAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxV2wA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxWAgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxWJAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxWWgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxWngA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxW4wA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxXAgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxXKwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxXYwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxXqQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxX6gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxYCAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxYLgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxYbwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxYsAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxY+gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxZAgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxZLwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxZdgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxZtgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxaAAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxaDwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxaSwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxagQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxavwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxbBQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxbPwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxbhAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxbvAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxcAwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxcRgA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxckQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxc2gA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxdEAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxdWAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxdrwA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxeDAA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxecQA0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxfCQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxfSgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxflAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxgFgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxgmwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxhBgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxhgQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxiAQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxiWgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxjAQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxjfgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxkRQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxk8QE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxlVQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxmDQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxm0QE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQxnMwE0sA0AAQGgAA/9sYwHAAAFJiKugG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CQkJgP//uQx+sAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQx/dwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyAIwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyAVQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyAswE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyBHwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyBYwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyB2wE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyCEwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyCWgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyCqQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyDBQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyDRgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyDbgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyDtQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyEAAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyEIAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyETAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyEnAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyE5gE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyFAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyFKwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyFYAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyFnwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyF6QE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyGBAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyGLQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyGbQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyGsQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyG9AE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyHAgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyHLQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyHbgE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyHtQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyH/AE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyIAQE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyIQwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyIigE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyIvwE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyJBAE0sA0AAQGgAA/9sYwHAAAFJiKugGAAANITAAABhgABEYgAAYYIAAAGCAAAAJCQkJgP//uQyJQAQBQAAgAIAA/9sYwEAAABRklDQgQAAANMYXZmNTYuNDAuMTAx';

// Helper to decode base64 to ArrayBuffer for Web Audio API
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const App: React.FC = () => {
    const [invoiceName, setInvoiceName] = useLocalStorage<string>('invoiceName', '');
    const [tempInvoiceName, setTempInvoiceName] = useState<string>('');
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [scannedItems, setScannedItems] = useLocalStorage<ScannedItem[]>('scannedItems', []);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>('soundEnabled', true);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const barcodeBuffer = useRef<string>('');
    const barcodeTimeoutRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const filteredItems = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase().trim();
        if (!lowerCaseQuery) {
            return scannedItems;
        }
        return scannedItems.filter(item => 
            item.barcode.toLowerCase().includes(lowerCaseQuery) ||
            item.model.toLowerCase().includes(lowerCaseQuery) ||
            item.size.toLowerCase().includes(lowerCaseQuery) ||
            item.color.toLowerCase().includes(lowerCaseQuery)
        );
    }, [scannedItems, searchQuery]);

    useEffect(() => {
        setIsInitialized(true); // Mark initialization as complete
        try {
            // Initialize AudioContext. It's best to create it once.
            // On some browsers, it starts in a 'suspended' state and needs to be resumed on user interaction.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }, []);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };
    
    const playSound = useCallback(async (type: 'success' | 'error') => {
        if (!soundEnabled || !audioContextRef.current) return;

        const audioContext = audioContextRef.current;
        
        // Resume AudioContext if it's suspended, which happens on page load in many browsers.
        if (audioContext.state === 'suspended') {
            await audioContext.resume().catch(e => console.error("Could not resume AudioContext:", e));
        }
        
        try {
            const soundDataUri = type === 'success' ? successSound : errorSound;
            const base64Sound = soundDataUri.split(',')[1];
            if (!base64Sound) {
                console.error("Could not extract base64 data from sound URI");
                return;
            }
            const arrayBuffer = base64ToArrayBuffer(base64Sound);
            
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
        } catch (e) {
            console.error("Error playing sound with Web Audio API:", e);
        }
    }, [soundEnabled]);

    const handleFileLoaded = (data: ExcelRow[]) => {
        setExcelData(data);
        setError(null);
        showToast('تم تحميل ملف Excel بنجاح.');
    };

    const handleFileError = (errorMessage: string) => {
        setError(errorMessage);
        setExcelData([]);
    };

    const handleCodeProcess = useCallback((code: string) => {
        if (!code) return;

        const foundRow = excelData.find(row => row['I']?.toString().trim() === code.trim());
        
        if (foundRow) {
            const newItem: ScannedItem = {
                barcode: code,
                model: foundRow['H'] || 'غير متوفر',
                size: foundRow['G'] || 'غير متوفر',
                color: foundRow['F'] || 'غير متوفر',
                timestamp: new Date(),
            };
            setScannedItems(prev => [newItem, ...prev]);
            showToast(`تمت إضافة: ${code}`);
            playSound('success');
        } else {
            playSound('error');
            const confirmAdd = window.confirm(`الكود "${code}" غير موجود في الملف. هل تريد إضافته يدويًا؟`);
            if (confirmAdd) {
                const newItem: ScannedItem = {
                    barcode: code,
                    model: 'إدخال يدوي',
                    size: '-',
                    color: '-',
                    timestamp: new Date(),
                };
                setScannedItems(prev => [newItem, ...prev]);
                showToast(`تمت إضافة الكود يدويًا: ${code}`);
            }
        }
    }, [excelData, setScannedItems, playSound]);

    const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
        if (!invoiceName || excelData.length === 0) {
            return;
        }

        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (barcodeBuffer.current.length > 0) {
                handleCodeProcess(barcodeBuffer.current);
                barcodeBuffer.current = '';
            }
            return;
        }

        if (e.key.length > 1) {
            return;
        }

        barcodeBuffer.current += e.key;

        if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
        }

        barcodeTimeoutRef.current = window.setTimeout(() => {
            barcodeBuffer.current = '';
        }, 100);
    }, [invoiceName, excelData, handleCodeProcess]);

    useEffect(() => {
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, [handleGlobalKeyDown]);

    const handleDeleteItem = (timestamp: Date) => {
        setScannedItems(prev => prev.filter(item => item.timestamp.getTime() !== timestamp.getTime()));
    };

    const handleClearAll = () => {
        if (window.confirm('هل أنت متأكد من رغبتك في مسح كل العناصر؟')) {
            setScannedItems([]);
            showToast('تم مسح جميع العناصر.');
        }
    };

    const handleExport = () => {
        if (scannedItems.length === 0) {
            alert('لا توجد بيانات لتصديرها.');
            return;
        }

        const content = scannedItems.map(item => item.barcode).join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const filename = `${invoiceName || 'جرد'}_${timestamp}.txt`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('تم تصدير الملف بنجاح.');
    };

    const handleSetInvoiceName = () => {
        if (tempInvoiceName.trim()) {
            setInvoiceName(tempInvoiceName.trim());
        }
    }

    if (!isInitialized) {
        return null; // or a loading spinner
    }

    if (!invoiceName) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 text-center">
                    <h1 className="text-2xl font-bold mb-4 text-teal-600 dark:text-teal-400">برنامج جرد المنتجات</h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-300">الرجاء إدخال اسم الفاتورة أو الجلسة للبدء.</p>
                    <input
                        type="text"
                        value={tempInvoiceName}
                        onChange={(e) => setTempInvoiceName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSetInvoiceName()}
                        placeholder="مثال: فاتورة المورد س"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        autoFocus
                    />
                    <button
                        onClick={handleSetInvoiceName}
                        className="w-full mt-4 bg-teal-600 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition disabled:bg-gray-400"
                        disabled={!tempInvoiceName.trim()}
                    >
                        بدء الجرد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 font-sans">
            {toastMessage && <Toast message={toastMessage} />}
            <header className="mb-6 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div>
                    <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400">برنامج جرد المنتجات</h1>
                    <p className="text-gray-600 dark:text-gray-300">فاتورة: <span className="font-semibold">{invoiceName}</span></p>
                </div>
                <div className="flex items-center gap-4">
                     <button
                        onClick={() => setSoundEnabled(prev => !prev)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                        title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                        aria-label={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                    >
                        {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('هل تريد تغيير اسم الفاتورة؟ سيتم الاحتفاظ بالبيانات الممسوحة.')) {
                                setInvoiceName('');
                            }
                        }}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        تغيير اسم الفاتورة
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">1. تحميل الملف</h2>
                        <FileUpload onFileLoaded={handleFileLoaded} onError={handleFileError} />
                        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
                    </div>

                    <div className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-opacity duration-500 ${excelData.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <h2 className="text-xl font-semibold mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">2. مسح أو إدخال الباركود</h2>
                        <Scanner onCodeScanned={handleCodeProcess} disabled={excelData.length === 0} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold">العناصر الممسوحة ({scannedItems.length})</h2>
                        <div className="flex gap-2">
                           <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:bg-gray-400" disabled={scannedItems.length === 0}>
                                <ExportIcon />
                                تصدير
                            </button>
                            <button onClick={handleClearAll} className="bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition disabled:bg-gray-400" disabled={scannedItems.length === 0}>
                                مسح الكل
                            </button>
                        </div>
                    </div>

                    {scannedItems.length > 0 && (
                        <div className="mb-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="🔍 بحث (باركود، اسم، لون، مقاس)..."
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        title="مسح البحث"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {searchQuery && filteredItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <p className="text-lg">❌ لا توجد نتائج مطابقة.</p>
                        </div>
                    ) : (
                        <ScannedItemsTable items={filteredItems} onDelete={handleDeleteItem} />
                    )}

                    <Statistics items={scannedItems} />
                </div>
            </main>
        </div>
    );
};

export default App;

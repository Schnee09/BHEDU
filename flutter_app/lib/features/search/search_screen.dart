/// Search Screen - Global search for students and classes
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/ui/ui_components.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Tìm kiếm học sinh, lớp học...',
            border: InputBorder.none,
            focusedBorder: InputBorder.none,
            enabledBorder: InputBorder.none,
          ),
          onChanged: (value) {
            setState(() => _query = value);
          },
        ),
        actions: [
          if (_query.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () {
                _searchController.clear();
                setState(() => _query = '');
              },
            ),
        ],
      ),
      body: _query.isEmpty
          ? _RecentSearches()
          : _SearchResults(query: _query),
    );
  }
}

class _RecentSearches extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionHeader(title: 'Tìm kiếm gần đây'),
        ListTile(
          leading: const Icon(Icons.history),
          title: const Text('Nguyễn Văn A'),
          onTap: () {},
        ),
        ListTile(
          leading: const Icon(Icons.history),
          title: const Text('Lớp 10A1'),
          onTap: () {},
        ),
      ],
    );
  }
}

class _SearchResults extends StatelessWidget {
  final String query;

  const _SearchResults({required this.query});

  @override
  Widget build(BuildContext context) {
    // Mock search results
    final results = [
      {'type': 'student', 'title': 'Nguyễn Văn An', 'subtitle': 'Lớp 10A1'},
      {'type': 'student', 'title': 'Trần Thị Bình', 'subtitle': 'Lớp 11B2'},
      {'type': 'class', 'title': 'Lớp 10A1', 'subtitle': 'Phòng 201 - GVCN: Lê Văn C'},
    ].where((item) => item['title']!.toLowerCase().contains(query.toLowerCase())).toList();

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 64, color: AppColors.textMuted),
            const SizedBox(height: 16),
            Text('Không tìm thấy kết quả cho "$query"'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: results.length,
      itemBuilder: (context, index) {
        final item = results[index];
        final isStudent = item['type'] == 'student';
        
        return AppCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          onTap: () {
            if (isStudent) {
              // context.push('/students/1'); // Mock ID
            } else {
              // context.push('/classes/1');
            }
          },
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: isStudent ? AppColors.student : AppColors.primary,
                child: Icon(
                  isStudent ? Icons.person : Icons.class_,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['title']!,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      item['subtitle']!,
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        );
      },
    );
  }
}
